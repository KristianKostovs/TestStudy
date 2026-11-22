import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createInterface } from "node:readline";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  materializeExercise,
  openExercise,
  registeredExerciseIds,
  runExerciseVerification,
  workspaceHealth,
} from "../local-companion/workspace-manager.mjs";

test("没有 Codex 和虚拟环境时，连接器仍可返回积木练习的真实结果", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "python-quest-bridge-test-"));
  const server = spawn(process.execPath, [fileURLToPath(new URL("../local-companion/server.mjs", import.meta.url))], {
    env: { ...process.env, PYTHON_QUEST_WORKSPACE_ROOT: root, PYTHON_QUEST_CODEX_BIN: join(root, "no-codex"), PYTHON_QUEST_CODEX_PORT: "0" },
    stdio: ["ignore", "pipe", "inherit"],
  });
  const closed = once(server, "close");
  t.after(async () => {
    server.kill();
    await closed;
    rmSync(root, { recursive: true, force: true });
  });

  const lines = createInterface({ input: server.stdout });
  const [start] = await once(lines, "line", { signal: AbortSignal.timeout(10_000) });
  const base = start.match(/http:\/\/127\.0\.0\.1:\d+/)?.[0];
  assert.ok(base, start);
  const health = await (await fetch(new URL("/health", base))).json();
  assert.equal(health.ok, false);
  assert.equal(health.workspaceBridge, true);

  async function verify() {
    const response = await fetch(new URL("/workspace/run", base), {
      method: "POST",
      headers: { Origin: "http://127.0.0.1:3000", "Content-Type": "application/json" },
      body: JSON.stringify({ exerciseId: "python-framework-block-01" }),
    });
    assert.equal(response.status, 200);
    return response.json();
  }

  const starter = await verify();
  assert.equal(starter.exitCode, 1);
  assert.match(starter.stdout, /FAIL 1/);
  assert.match(starter.hint, /exercises\/01_values\.py/);
  assert.doesNotMatch(starter.hint, /\.venv/);
  const project = join(root, "python-framework-blocks");
  copyFileSync(join(project, "solutions/01_values.py"), join(project, "exercises/01_values.py"));
  const completed = await verify();
  assert.equal(completed.exitCode, 0);
  assert.match(completed.stdout, /PASS 1/);
});

test("从每块积木打开 VS Code 都选中验证器读取的练习文件", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "python-quest-editor-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const launchEditor = t.mock.fn();
  const workspacePath = join(root, "python-framework-blocks");
  const manifest = new URL("../course-starters/python-framework-blocks/metadata.json", import.meta.url);
  const blocks = JSON.parse(readFileSync(manifest, "utf8"));

  for (const [index, { id, file }] of blocks.entries()) {
    const exerciseId = `python-framework-block-${String(id).padStart(2, "0")}`;
    const opened = await openExercise(exerciseId, root, launchEditor);
    const filePath = join(workspacePath, "exercises", file);
    assert.equal(opened.created, index === 0);
    assert.equal(opened.workspacePath, workspacePath);
    assert.ok(existsSync(filePath));
    assert.deepEqual(launchEditor.mock.calls.at(-1).arguments, [[workspacePath, filePath]]);
    assert.ok(opened.message.includes(`exercises/${file}`));
  }

  const project = await openExercise("python-agent-level-08", root, launchEditor);
  assert.deepEqual(launchEditor.mock.calls.at(-1).arguments, [[project.workspacePath, join(project.workspacePath, "src/ticket_assistant/settings.py")]]);
  rmSync(join(workspacePath, "exercises", "01_values.py"));
  await assert.rejects(openExercise("python-framework-block-01", root, launchEditor), /缺少本关练习文件/);
  assert.equal(launchEditor.mock.callCount(), blocks.length + 1);
});

test("本地项目桥只创建登记过的课程项目，并保留已有练习", () => {
  const root = mkdtempSync(join(tmpdir(), "python-quest-workspace-test-"));
  try {
    assert.deepEqual(registeredExerciseIds, [
      "python-framework-block-01",
      "python-framework-block-02",
      "python-framework-block-03",
      "python-framework-block-04",
      "python-framework-block-05",
      "python-framework-block-06",
      "python-framework-block-07",
      "python-framework-block-08",
      "python-agent-level-08",
      "quality-lab-summary", "quality-lab-inventory", "quality-lab-classification", "quality-lab-gate", "quality-lab-metrics",
    ]);
    assert.throws(() => materializeExercise("../../private", root), /未登记/);
    const first = materializeExercise("python-agent-level-08", root);
    assert.equal(first.created, true);
    assert.ok(first.workspacePath.startsWith(root));
    for (const relative of [
      "pyproject.toml",
      "src/ticket_assistant/settings.py",
      "tests/test_settings.py",
      ".vscode/launch.json",
      ".vscode/tasks.json",
    ]) assert.ok(existsSync(join(first.workspacePath, relative)), relative);

    const second = materializeExercise("python-agent-level-08", root);
    assert.equal(second.created, false);
    assert.equal(second.workspacePath, first.workspacePath);
    assert.equal(workspaceHealth("python-agent-level-08", root).created, true);

    const block = materializeExercise("python-framework-block-01", root);
    assert.ok(block.workspacePath.startsWith(root));
    for (const relative of [
      "verify.py",
      "exercises/01_values.py",
      "examples/08_runner.py",
      ".vscode/launch.json",
      ".vscode/tasks.json",
    ]) assert.ok(existsSync(join(block.workspacePath, relative)), relative);
    assert.equal(materializeExercise("python-framework-block-08", root).workspacePath, block.workspacePath);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("五项职业练习定位学员文件中的对应函数，并只运行本项测试", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "quality-lab-workspace-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  const { file, tasks } = JSON.parse(readFileSync(new URL("../config/quality-lab.json", import.meta.url), "utf8"));
  const launch = t.mock.fn();
  for (const { task, symbol } of tasks) {
    const id = `quality-lab-${task}`;
    const { workspacePath } = await openExercise(id, root, launch);
    const target = join(workspacePath, file);
    const line = readFileSync(target, "utf8").split("\n").findIndex((s) => s.trimStart().startsWith(`def ${symbol.split(".").at(-1)}(`)) + 1;
    assert.ok(line > 0);
    assert.deepEqual(launch.mock.calls.at(-1).arguments, [[workspacePath, "--goto", `${target}:${line}:1`]]);
    const result = runExerciseVerification(id, root);
    assert.equal(result.exitCode, 1);
    assert.match(result.command, new RegExp(`run_tests\\.py --task ${task}$`));
    assert.match(result.stdout, /LEARNER IMPLEMENTATION/);
  }
  const path = join(root, "quality-engineering-lab");
  copyFileSync(join(path, "solutions/lab.py"), join(path, file));
  for (const { task } of tasks) assert.equal(runExerciseVerification(`quality-lab-${task}`, root).exitCode, 0);
});

test("网页提供 VS Code 打开与固定测试证据入口", () => {
  const component = readFileSync(new URL("../app/courses/WorkspacePractice.tsx", import.meta.url), "utf8");
  const server = readFileSync(new URL("../local-companion/server.mjs", import.meta.url), "utf8");
  const manager = readFileSync(new URL("../local-companion/workspace-manager.mjs", import.meta.url), "utf8");
  assert.match(component, /在 VS Code 中打开/);
  assert.match(component, /运行本关验证/);
  assert.match(component, /下载 ZIP 备用/);
  assert.match(component, /exitCode/);
  assert.match(server, /\/workspace\/open/);
  assert.match(server, /\/workspace\/run/);
  assert.match(manager, /verifyArgs: \["-m", "pytest", "-q"\]/);
  assert.match(manager, /python-framework-block-/);
  assert.match(manager, /verify\.py/);
  assert.doesNotMatch(server, /payload\.(?:path|command|args)/);
});

test("学习中心提供首个真实项目入口并仅映射相关关卡", () => {
  const home = readFileSync(new URL("../app/LearningHome.tsx", import.meta.url), "utf8");
  const interactiveCourse = readFileSync(new URL("../app/ai-developer-level5/AiDeveloperCourse.tsx", import.meta.url), "utf8");
  const pythonFramework = readFileSync(new URL("../app/courses/python-framework/PythonCourseClient.tsx", import.meta.url), "utf8");
  const blueprintCourse = readFileSync(new URL("../app/courses/BlueprintCourseClient.tsx", import.meta.url), "utf8");
  const projectLink = readFileSync(new URL("../app/courses/ProjectTrackLink.tsx", import.meta.url), "utf8");
  const projectPage = readFileSync(new URL("../app/learn/real-project/page.tsx", import.meta.url), "utf8");
  const projectTemplate = readFileSync(new URL("../app/real-projects/ProjectLearningTemplate.tsx", import.meta.url), "utf8");
  const projectData = readFileSync(new URL("../app/real-projects/first-project.ts", import.meta.url), "utf8");

  assert.match(home, /能力构成主线/);
  assert.match(home, /查看案例练习/);
  assert.match(interactiveCourse, /<ProjectTrackLink/);
  assert.match(pythonFramework, /<ProjectTrackLink/);
  assert.match(blueprintCourse, /<ProjectTrackLink/);
  assert.match(projectLink, /firstProjectMappingFor/);
  assert.match(projectLink, /if \(!mapping\) return null/);
  assert.match(projectPage, /firstProjectCourseMappings/);
  assert.match(projectTemplate, /<LearningStepNav/);
  for (const heading of ["目标", "前置知识", "简明讲解", "动手任务", "客观验收"]) {
    assert.match(projectTemplate, new RegExp(heading));
  }
  assert.match(projectData, /运行证据待补/);
});
