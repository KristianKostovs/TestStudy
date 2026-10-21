import assert from "node:assert/strict";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  materializeExercise,
  registeredExerciseIds,
  workspaceHealth,
} from "../local-companion/workspace-manager.mjs";

test("本地项目桥只创建登记过的课程项目，并保留已有练习", () => {
  const root = mkdtempSync(join(tmpdir(), "python-quest-workspace-test-"));
  try {
    assert.deepEqual(registeredExerciseIds, ["python-agent-level-08"]);
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
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test("网页提供 VS Code 打开与固定测试证据入口", () => {
  const component = readFileSync(new URL("../app/courses/WorkspacePractice.tsx", import.meta.url), "utf8");
  const server = readFileSync(new URL("../local-companion/server.mjs", import.meta.url), "utf8");
  const manager = readFileSync(new URL("../local-companion/workspace-manager.mjs", import.meta.url), "utf8");
  assert.match(component, /在 VS Code 中打开/);
  assert.match(component, /运行本关验证/);
  assert.match(component, /exitCode/);
  assert.match(server, /\/workspace\/open/);
  assert.match(server, /\/workspace\/run/);
  assert.match(manager, /verifyArgs: \["-m", "pytest", "-q"\]/);
  assert.doesNotMatch(server, /payload\.(?:path|command|args)/);
});

test("整个学习中心都提供待绑定的真实需求项目入口", () => {
  const home = readFileSync(new URL("../app/LearningHome.tsx", import.meta.url), "utf8");
  const interactiveCourse = readFileSync(new URL("../app/ai-developer-level5/AiDeveloperCourse.tsx", import.meta.url), "utf8");
  const pythonFramework = readFileSync(new URL("../app/courses/python-framework/PythonCourseClient.tsx", import.meta.url), "utf8");
  const blueprintCourse = readFileSync(new URL("../app/courses/[moduleId]/page.tsx", import.meta.url), "utf8");
  const projectLink = readFileSync(new URL("../app/courses/ProjectTrackLink.tsx", import.meta.url), "utf8");
  const projectPage = readFileSync(new URL("../app/learn/real-project/page.tsx", import.meta.url), "utf8");

  assert.match(home, /真实需求项目入口/);
  assert.match(interactiveCourse, /<ProjectTrackLink/);
  assert.match(pythonFramework, /<ProjectTrackLink/);
  assert.match(blueprintCourse, /<ProjectTrackLink/);
  assert.match(projectLink, /真实需求项目待绑定/);
  assert.match(projectPage, /等待绑定具体需求与代码库/);
  assert.match(projectPage, /平台不会把教学示例标成真实项目/);
});
