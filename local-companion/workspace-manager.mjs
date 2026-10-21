import { spawn, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const companionDir = dirname(fileURLToPath(import.meta.url));
const projectDir = resolve(companionDir, "..");
const defaultWorkspaceRoot = resolve(
  process.env.PYTHON_QUEST_WORKSPACE_ROOT ?? join(homedir(), "PythonQuestWorkspaces"),
);

const exerciseRegistry = Object.freeze({
  "python-agent-level-08": Object.freeze({
    title: "Python → Agent 第 8 关：工单查询助手环境",
    source: resolve(projectDir, "course-starters", "python-agent-level-08"),
    directory: "ticket-assistant-level-08",
    verifyArgs: ["-m", "pytest", "-q"],
  }),
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

export function openExercise(exerciseId, workspaceRoot = defaultWorkspaceRoot) {
  const materialized = materializeExercise(exerciseId, workspaceRoot);
  const child = spawn(findCodeCommand(), ["--new-window", materialized.workspacePath], {
    detached: true,
    stdio: "ignore",
  });
  child.unref();
  return {
    ok: true,
    created: materialized.created,
    title: materialized.exercise.title,
    workspacePath: materialized.workspacePath,
    message: materialized.created ? "项目骨架已创建并在 VS Code 中打开" : "已保留你的代码并重新打开项目",
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
  const missingEnvironment = !existsSync(join(workspacePath, ".venv"));
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
    hint: missingEnvironment
      ? "当前项目还没有 .venv。请先在 VS Code 终端按 README 创建环境并安装依赖。"
      : exitCode === 0 ? "真实测试已经通过，可以保留这份运行记录。" : "测试没有通过，请根据上面的失败信息继续调试。",
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
