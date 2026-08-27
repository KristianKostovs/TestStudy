import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, "..");
const defaultConfigPath = resolve(projectDirectory, ".local", "learning-sources.json");
const excludedDirectories = new Set([
  ".git",
  ".codegraph",
  ".next",
  ".pytest_cache",
  ".venv",
  ".vinext",
  ".wrangler",
  "__pycache__",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "output",
  "outputs",
  "reports",
  "_reports",
  "venv",
  "work",
]);

function normalizePath(value) {
  return value.split(sep).join("/");
}

async function readJson(path) {
  return JSON.parse(await fs.readFile(path, "utf8"));
}

async function writeJson(path, value) {
  await fs.mkdir(dirname(path), { recursive: true });
  await fs.writeFile(path, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

function validateConfig(config) {
  if (!config || config.version !== 1 || typeof config.root !== "string" || !Array.isArray(config.sources)) {
    throw new Error("知识源配置格式无效");
  }
  if (!Array.isArray(config.extensions) || !config.extensions.length) throw new Error("知识源配置缺少 extensions");
  if (!config.discoverTopLevelProjects && !config.sources.length) throw new Error("知识源配置必须声明 sources 或启用 discoverTopLevelProjects");
  for (const source of config.sources) {
    if (!source.id || !source.title || !Array.isArray(source.paths) || !source.paths.length) {
      throw new Error("每个知识源必须包含 id、title 和 paths");
    }
  }
}

function projectSourceId(name) {
  const digest = createHash("sha1").update(name).digest("hex").slice(0, 10);
  return `project.local.${digest}`;
}

async function resolvedSources(config) {
  const sources = [...config.sources];
  if (!config.discoverTopLevelProjects) return sources;
  const entries = await fs.readdir(config.root, { withFileTypes: true });
  const configuredPaths = new Set(sources.flatMap((source) => source.paths).map(normalizePath));
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name, "zh-CN"))) {
    if (!entry.isDirectory() || entry.isSymbolicLink() || entry.name.startsWith(".") || excludedDirectories.has(entry.name)) continue;
    if (configuredPaths.has(normalizePath(entry.name))) continue;
    sources.push({ id: projectSourceId(entry.name), title: entry.name, paths: [entry.name] });
  }
  return sources;
}

async function hashFile(path) {
  const content = await fs.readFile(path);
  return createHash("sha256").update(content).digest("hex");
}

async function walkDirectory(basePath, relativeRoot, options, records) {
  const entries = await fs.readdir(basePath, { withFileTypes: true });
  entries.sort((left, right) => left.name.localeCompare(right.name, "zh-CN"));
  for (const entry of entries) {
    if (entry.isSymbolicLink()) continue;
    const absolutePath = join(basePath, entry.name);
    if (entry.isDirectory()) {
      if (!excludedDirectories.has(entry.name) && !entry.name.startsWith("backup_")) {
        await walkDirectory(absolutePath, join(relativeRoot, entry.name), options, records);
      }
      continue;
    }
    if (!entry.isFile() || !options.extensions.has(extname(entry.name).toLowerCase())) continue;
    const stat = await fs.stat(absolutePath);
    if (stat.size > options.maxFileBytes) continue;
    const displayPath = normalizePath(join(options.pathLabel, relativeRoot, entry.name));
    const key = `${options.sourceId}:${displayPath}`;
    records[key] = {
      sourceId: options.sourceId,
      sourceTitle: options.sourceTitle,
      path: displayPath,
      size: stat.size,
      sha256: await hashFile(absolutePath),
    };
  }
}

export async function createSnapshot(config, scannedAt = new Date().toISOString()) {
  validateConfig(config);
  const sources = await resolvedSources(config);
  const extensions = new Set(config.extensions.map((extension) => extension.toLowerCase()));
  const maxFileBytes = Number(config.maxFileBytes) || 2_097_152;
  const files = {};
  const unavailablePaths = [];

  for (const source of sources) {
    for (const configuredPath of source.paths) {
      const sourcePath = isAbsolute(configuredPath) ? configuredPath : resolve(config.root, configuredPath);
      try {
        const stat = await fs.stat(sourcePath);
        if (!stat.isDirectory()) throw new Error("not a directory");
        await walkDirectory(sourcePath, "", {
          extensions,
          maxFileBytes,
          sourceId: source.id,
          sourceTitle: source.title,
          pathLabel: normalizePath(relative(config.root, sourcePath) || configuredPath),
        }, files);
      } catch {
        unavailablePaths.push(normalizePath(configuredPath));
      }
    }
  }

  return {
    version: 1,
    scannedAt,
    rootAvailable: unavailablePaths.length < sources.flatMap((source) => source.paths).length,
    unavailablePaths,
    sourceTitles: Object.fromEntries(sources.map((source) => [source.id, source.title])),
    files,
  };
}

export function compareSnapshots(previous, current) {
  const previousFiles = previous?.files ?? {};
  const currentFiles = current.files;
  const added = [];
  const modified = [];
  const deleted = [];

  for (const [key, file] of Object.entries(currentFiles)) {
    if (!previousFiles[key]) added.push(file);
    else if (previousFiles[key].sha256 !== file.sha256) modified.push(file);
  }
  for (const [key, file] of Object.entries(previousFiles)) {
    if (!currentFiles[key]) deleted.push(file);
  }

  const sorter = (left, right) => `${left.sourceId}:${left.path}`.localeCompare(`${right.sourceId}:${right.path}`, "zh-CN");
  added.sort(sorter);
  modified.sort(sorter);
  deleted.sort(sorter);
  return { added, modified, deleted, changed: added.length + modified.length + deleted.length > 0 };
}

function groupedCounts(files) {
  const counts = {};
  for (const file of Object.values(files)) counts[file.sourceId] = (counts[file.sourceId] ?? 0) + 1;
  return counts;
}

function markdownList(title, files, limit = 200) {
  const visible = files.slice(0, limit);
  const lines = [`## ${title}（${files.length}）`, ""];
  if (!files.length) return [...lines, "- 无", ""].join("\n");
  lines.push(...visible.map((file) => `- \`${file.sourceId}\` · ${file.path}`));
  if (files.length > visible.length) lines.push(`- 其余 ${files.length - visible.length} 个文件请查看 latest.json`);
  lines.push("");
  return lines.join("\n");
}

async function writeReport(outputDirectory, result) {
  const latestJsonPath = resolve(outputDirectory, "latest.json");
  const latestMarkdownPath = resolve(outputDirectory, "latest.md");
  const markdown = [
    "# 本地学习知识源巡检",
    "",
    `- 扫描时间：${result.scannedAt}`,
    `- 扫描文件：${result.totalFiles}`,
    `- 状态：${result.baselineCreated ? "已建立首次基线" : result.changed ? "发现变化，等待 Knowledge Diff 评审" : "没有变化"}`,
    `- 不可访问路径：${result.unavailablePaths.length ? result.unavailablePaths.join("、") : "无"}`,
    "",
    markdownList("新增", result.changes.added),
    markdownList("修改", result.changes.modified),
    markdownList("删除", result.changes.deleted),
    "## 评审规则",
    "",
    "- 纯业务字段或页面变化：只记录，不更新课程。",
    "- 同一能力的新项目案例：建议更新案例或练习。",
    "- 已有能力的新难点：建议增加挑战任务。",
    "- 新的可迁移能力或必要前置知识：建议新增正式关卡。",
    "- 巡检不得修改或上传原始项目文件。",
    "",
  ].join("\n");
  await writeJson(latestJsonPath, result);
  await fs.writeFile(latestMarkdownPath, markdown, "utf8");
  return { latestJsonPath, latestMarkdownPath };
}

export async function scanKnowledgeSources({ configPath = defaultConfigPath, now = new Date().toISOString() } = {}) {
  const config = await readJson(configPath);
  validateConfig(config);
  const outputDirectory = isAbsolute(config.outputDirectory)
    ? config.outputDirectory
    : resolve(projectDirectory, config.outputDirectory || "work/knowledge-diff");
  const statePath = resolve(outputDirectory, "state.json");
  const pendingPath = resolve(outputDirectory, "pending.json");
  const snapshot = await createSnapshot(config, now);
  let previous = null;
  try { previous = await readJson(statePath); } catch {}
  const baselineCreated = !previous;
  const changes = baselineCreated ? { added: [], modified: [], deleted: [], changed: false } : compareSnapshots(previous, snapshot);
  const result = {
    ok: true,
    scannedAt: now,
    baselineCreated,
    changed: changes.changed,
    pending: changes.changed,
    totalFiles: Object.keys(snapshot.files).length,
    filesBySource: groupedCounts(snapshot.files),
    sourceTitles: snapshot.sourceTitles,
    unavailablePaths: snapshot.unavailablePaths,
    changes,
    statePath,
    pendingPath,
  };

  await fs.mkdir(outputDirectory, { recursive: true });
  if (baselineCreated) await writeJson(statePath, snapshot);
  if (changes.changed) await writeJson(pendingPath, { version: 1, createdAt: now, snapshot, result });
  const reportPaths = await writeReport(outputDirectory, result);
  return { ...result, ...reportPaths };
}

export async function acknowledgePending({ configPath = defaultConfigPath, now = new Date().toISOString() } = {}) {
  const config = await readJson(configPath);
  const outputDirectory = isAbsolute(config.outputDirectory)
    ? config.outputDirectory
    : resolve(projectDirectory, config.outputDirectory || "work/knowledge-diff");
  const pendingPath = resolve(outputDirectory, "pending.json");
  const statePath = resolve(outputDirectory, "state.json");
  const pending = await readJson(pendingPath);
  await writeJson(statePath, { ...pending.snapshot, acknowledgedAt: now });
  await fs.rm(pendingPath);
  return { ok: true, acknowledged: true, acknowledgedAt: now, statePath };
}

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

async function main() {
  const configPath = resolve(argumentValue("--config") || defaultConfigPath);
  const result = process.argv.includes("--ack")
    ? await acknowledgePending({ configPath })
    : await scanKnowledgeSources({ configPath });
  if (process.argv.includes("--json")) process.stdout.write(`${JSON.stringify(result)}\n`);
  else if (result.baselineCreated) console.log(`已建立知识源基线：${result.totalFiles} 个文件`);
  else if (result.changed) console.log(`发现 ${result.changes.added.length + result.changes.modified.length + result.changes.deleted.length} 个变化，报告：${result.latestMarkdownPath}`);
  else console.log(`没有发现知识源变化，共检查 ${result.totalFiles} 个文件`);
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : "";
if (import.meta.url === invokedPath) {
  main().catch((error) => {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
}
