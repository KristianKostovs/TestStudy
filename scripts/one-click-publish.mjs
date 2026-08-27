import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const projectDirectory = resolve(scriptDirectory, "..");
const preflightOnly = process.argv.includes("--preflight");
const requestedMessage = process.argv.slice(2).filter((argument) => argument !== "--preflight").join(" ").trim();
const timestamp = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "Asia/Shanghai",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
}).format(new Date()).replaceAll("/", "-");
const commitMessage = requestedMessage || `chore: publish learning site ${timestamp}`;

function commandPath(command) {
  const probe = process.platform === "win32" ? "where" : "which";
  const result = spawnSync(probe, [command], { encoding: "utf8" });
  return result.status === 0 ? result.stdout.trim().split(/\r?\n/)[0] : null;
}

function run(command, args, { capture = false, input, ...options } = {}) {
  return spawnSync(command, args, {
    cwd: projectDirectory,
    encoding: "utf8",
    stdio: capture ? "pipe" : input === undefined ? "inherit" : ["pipe", "inherit", "inherit"],
    input,
    ...options,
  });
}

function fail(message) {
  console.error(`\n发布已停止：${message}`);
  console.error("所有本地文件都会保留，你可以修复问题后重新运行。\n");
  process.exit(1);
}

function requireCommand(command, help) {
  const resolved = commandPath(command);
  if (!resolved) fail(`${help}（缺少 ${command} 命令）`);
  return resolved;
}

function changedPaths() {
  const result = run("git", ["status", "--porcelain=v1", "-z", "--untracked-files=all"], { capture: true });
  if (result.status !== 0) fail("无法读取 Git 修改状态");
  const entries = result.stdout.split("\0").filter(Boolean);
  const paths = [];
  for (let index = 0; index < entries.length; index += 1) {
    const entry = entries[index];
    const status = entry.slice(0, 2);
    let path = entry.slice(3);
    if ((status.includes("R") || status.includes("C")) && entries[index + 1]) path = entries[index += 1];
    paths.push(path.replaceAll("\\", "/"));
  }
  return paths;
}

function isSensitivePath(path) {
  const name = path.split("/").at(-1).toLowerCase();
  if (name === ".env.example") return false;
  return name === ".env"
    || name.startsWith(".env.")
    || name === "auth.json"
    || name === "storage-state.json"
    || name === "cookies.json"
    || name === "id_rsa"
    || name.endsWith(".pem")
    || name.endsWith(".key");
}

console.log("\n测试能力成长平台 · 一键提交并发布");
console.log("====================================");

requireCommand("git", "请先安装 Git");
requireCommand("node", "请先安装 Node.js 22.13 或更高版本");
requireCommand("npm", "请先安装 npm");
requireCommand("gh", "请先安装 GitHub CLI：https://cli.github.com/");
const codex = requireCommand("codex", "请先安装并打开 Codex 桌面应用");

const [nodeMajor, nodeMinor] = process.versions.node.split(".").map(Number);
if (nodeMajor < 22 || (nodeMajor === 22 && nodeMinor < 13)) fail(`当前 Node.js ${process.versions.node} 版本过低，请升级到 22.13 或更高版本`);

const repositoryCheck = run("git", ["rev-parse", "--show-toplevel"], { capture: true });
if (repositoryCheck.status !== 0 || resolve(repositoryCheck.stdout.trim()) !== projectDirectory) {
  fail("启动器不在 TestStudy 仓库根目录中");
}

const hostingPath = resolve(projectDirectory, ".openai", "hosting.json");
if (!existsSync(hostingPath)) fail("找不到 Sites 项目配置 .openai/hosting.json");
try {
  const hosting = JSON.parse(readFileSync(hostingPath, "utf8"));
  if (!hosting.project_id) fail("Sites 项目配置缺少 project_id");
} catch (error) {
  fail(`Sites 项目配置无法读取：${error instanceof Error ? error.message : String(error)}`);
}

const unsafeChanges = changedPaths().filter(isSensitivePath);
if (unsafeChanges.length) {
  fail(`发现不应上传的本地敏感文件：${unsafeChanges.join("、")}`);
}

const githubStatus = run("gh", ["auth", "status"], { capture: true });
if (githubStatus.status !== 0) {
  console.log("\n这台电脑尚未授权 GitHub，即将打开官方授权流程……");
  const login = run("gh", ["auth", "login", "--hostname", "github.com", "--git-protocol", "https", "--web"]);
  if (login.status !== 0) fail("GitHub 授权未完成");
}

const codexStatus = run(codex, ["login", "status"], { capture: true });
if (codexStatus.status !== 0) fail("Codex 尚未登录，请先在 Codex 桌面应用中登录同一个 ChatGPT 账号");

if (preflightOnly) {
  console.log("\n预检通过：Git、GitHub、Codex、Sites 配置和敏感文件检查均正常。\n");
  process.exit(0);
}

const promptTemplate = readFileSync(resolve(scriptDirectory, "publish-with-codex.md"), "utf8");
const prompt = promptTemplate
  .replaceAll("{{PROJECT_DIRECTORY}}", projectDirectory)
  .replaceAll("{{COMMIT_MESSAGE}}", commitMessage);

console.log(`\n本次说明：${commitMessage}`);
console.log("Codex 将检查两台电脑的修改、验证网站并发布。过程中请保留此窗口。\n");

const result = run(codex, [
  "exec",
  "--approve-for-me",
  "--sandbox",
  "workspace-write",
  "--cd",
  projectDirectory,
  "--color",
  "always",
  "-",
], { input: prompt });

if (result.status !== 0) fail("Codex 未能完成提交或发布，请查看上方给出的具体原因");
console.log("\n一键流程已结束。请刷新线上学习网站确认最新内容。\n");
