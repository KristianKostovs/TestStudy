import { execFile, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import frameworkBlocks from "../course-starters/python-framework-blocks/metadata.json" with { type: "json" };
import qualityLab from "../config/quality-lab.json" with { type: "json" };

const runCodeCli = promisify(execFile);
const companionDir = dirname(fileURLToPath(import.meta.url));
const projectDir = resolve(companionDir, "..");
const defaultWorkspaceRoot = resolve(
  process.env.PYTHON_QUEST_WORKSPACE_ROOT ?? join(homedir(), "PythonQuestWorkspaces"),
);

const frameworkBlocksSource = resolve(projectDir, "course-starters", "python-framework-blocks");
const frameworkBlockExercises = Object.fromEntries(frameworkBlocks.map(({ id, file }) => [
  `python-framework-block-${String(id).padStart(2, "0")}`, Object.freeze({
    title: `Python 框架课前积木 ${id}`,
    source: frameworkBlocksSource,
    directory: "python-framework-blocks",
    practiceFile: `exercises/${file}`,
    verifyArgs: ["verify.py", "--block", String(id)],
  }),
]));

const exerciseRegistry = Object.freeze({
  ...frameworkBlockExercises,
  "python-agent-level-08": Object.freeze({
    title: "Python → Agent 第 8 关：工单查询助手环境",
    source: resolve(projectDir, "course-starters", "python-agent-level-08"),
    directory: "ticket-assistant-level-08",
    practiceFile: "src/ticket_assistant/settings.py",
    needsPytest: true,
    verifyArgs: ["-m", "pytest", "-q"],
  }),
  ...Object.fromEntries(qualityLab.tasks.map(({ task, symbol }) => [
    `quality-lab-${task}`, Object.freeze({
      title: `质量工程练习 · ${symbol}`,
      source: resolve(projectDir, "course-starters", "quality-engineering-lab"),
      directory: "quality-engineering-lab",
      practiceFile: qualityLab.file,
      symbol,
      verifyArgs: ["run_tests.py", "--task", task],
    }),
  ])),
});

function requireExercise(exerciseId) {
  const exercise = exerciseRegistry[exerciseId];
  if (!exercise) throw new Error("未登记的课程项目");
  if (!existsSync(exercise.source)) throw new Error("课程项目骨架不存在，请先更新学习平台");
  return exercise;
}

export function materializeExercise(exerciseId, workspaceRoot = defaultWorkspaceRoot) {
  const exercise = requireExercise(exerciseId);
  const safeRoot = resolve(workspaceRoot);
  const workspacePath = resolve(safeRoot, exercise.directory);
  if (workspacePath !== join(safeRoot, exercise.directory)) throw new Error("课程工作区路径无效");
  mkdirSync(safeRoot, { recursive: true });
  const created = !existsSync(workspacePath);
  if (created) cpSync(exercise.source, workspacePath, { recursive: true, errorOnExist: true });
  return { exercise, workspacePath, created };
}

function findCodeCommand() {
  const configured = process.env.PYTHON_QUEST_VSCODE_BIN;
  const candidates = [
    configured,
    "/Applications/Visual Studio Code.app/Contents/Resources/app/bin/code",
    "/Applications/Visual Studio Code - Insiders.app/Contents/Resources/app/bin/code-insiders",
    "code",
  ].filter(Boolean);
  for (const candidate of candidates) {
    if (candidate.includes("/") && existsSync(candidate)) return candidate;
    if (!candidate.includes("/")) {
      const probe = spawnSync(process.platform === "win32" ? "where" : "which", [candidate], { encoding: "utf8" });
      if (probe.status === 0) return probe.stdout.trim().split(/\r?\n/)[0];
    }
  }
  throw new Error("没有找到 VS Code。请先安装 VS Code，并让 code 命令可用");
}

function launchVSCode(args) {
  return runCodeCli(findCodeCommand(), args, { timeout: 30_000 });
}

export async function openExercise(exerciseId, workspaceRoot = defaultWorkspaceRoot, launchEditor = launchVSCode) {
  const { exercise, workspacePath, created } = materializeExercise(exerciseId, workspaceRoot);
  const filePath = join(workspacePath, exercise.practiceFile);
  if (!statSync(filePath, { throwIfNoEntry: false })?.isFile()) {
    throw new Error(`缺少本关练习文件 ${exercise.practiceFile}，请从课程 ZIP 恢复这个文件后重试。`);
  }
  const functionName = exercise.symbol?.split(".").at(-1);
  const line = functionName ? readFileSync(filePath, "utf8").split(/\r?\n/)
    .findIndex((text) => text.trimStart().startsWith(`def ${functionName}(`)) + 1 : 0;
  await launchEditor(line ? [workspacePath, "--goto", `${filePath}:${line}:1`] : [workspacePath, filePath]);
  return {
    ok: true,
    created,
    title: exercise.title,
    workspacePath,
    message: `已在 VS Code 打开本关练习 ${exercise.practiceFile}${line ? ` · ${exercise.symbol}` : ""}。项目目录`,
  };
}

function pythonCommand(workspacePath) {
  const relative = process.platform === "win32" ? [".venv", "Scripts", "python.exe"] : [".venv", "bin", "python"];
  const virtualPython = join(workspacePath, ...relative);
  if (existsSync(virtualPython)) return virtualPython;
  return process.platform === "win32" ? "python" : "python3";
}

export function runExerciseVerification(exerciseId, workspaceRoot = defaultWorkspaceRoot) {
  const { exercise, workspacePath } = materializeExercise(exerciseId, workspaceRoot);
  const command = pythonCommand(workspacePath);
  const startedAt = Date.now();
  const result = spawnSync(command, exercise.verifyArgs, {
    cwd: workspacePath,
    encoding: "utf8",
    timeout: 120_000,
    maxBuffer: 256_000,
    env: { ...process.env, PYTHONPATH: join(workspacePath, "src") },
  });
  const stdout = String(result.stdout ?? "").slice(-20_000);
  const stderr = String(result.stderr ?? "").slice(-20_000);
  const exitCode = Number.isInteger(result.status) ? result.status : null;
  const needsEnvironment = exercise.needsPytest && exitCode !== 0 && !existsSync(join(workspacePath, ".venv"));
  const retryHint = exercise.practiceFile
    ? `本关验证读取 ${exercise.practiceFile}。请在 VS Code 保存这个文件后重试。`
    : "测试没有通过，请根据上面的失败信息继续调试。";
  return {
    ok: exitCode === 0,
    exerciseId,
    title: exercise.title,
    workspacePath,
    command: [command, ...exercise.verifyArgs].join(" "),
    exitCode,
    durationMs: Date.now() - startedAt,
    stdout,
    stderr: result.error ? `${stderr}\n${result.error.message}`.trim() : stderr,
    hint: needsEnvironment
      ? "当前项目还没有 .venv。请先在 VS Code 终端按 README 创建环境并安装依赖。"
      : exitCode === 0 ? "真实测试已经通过，可以保留这份运行记录。" : retryHint,
  };
}

export function workspaceHealth(exerciseId, workspaceRoot = defaultWorkspaceRoot) {
  const exercise = requireExercise(exerciseId);
  const workspacePath = resolve(workspaceRoot, exercise.directory);
  return {
    exerciseId,
    title: exercise.title,
    workspacePath,
    created: existsSync(workspacePath),
    virtualEnvironment: existsSync(join(workspacePath, ".venv")),
  };
}

export const registeredExerciseIds = Object.freeze(Object.keys(exerciseRegistry));
