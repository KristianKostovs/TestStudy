import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";
import ts from "typescript";

async function moduleUrl(path, imports = {}) {
  const source = await readFile(new URL(path, import.meta.url), "utf8");
  let code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
  for (const [specifier, url] of Object.entries(imports)) code = code.replaceAll(JSON.stringify(specifier), JSON.stringify(url));
  return "data:text/javascript;base64," + Buffer.from(code).toString("base64");
}

const careerUrl = await moduleUrl("../app/career-curriculum.ts");
const roadmapUrl = await moduleUrl("../app/blueprint-roadmaps.ts");
const registryUrl = await moduleUrl("../app/learning-registry.ts", { "./career-curriculum": careerUrl, "./blueprint-roadmaps": roadmapUrl });
const chaptersUrl = await moduleUrl("../app/courses/blueprint-chapters.ts", { "../career-curriculum": careerUrl });
const registry = await import(registryUrl);
const career = await import(careerUrl);
const chapters = await import(chaptersUrl);

test("岗位路线覆盖全部新增课程，前置依赖存在且无环", () => {
  const ids = new Set(registry.learningModules.map((course) => course.id));
  for (const stage of career.careerStages) for (const id of stage.courseIds) assert.ok(ids.has(id), id);
  function visit(id, path = []) {
    assert.ok(ids.has(id), id);
    assert.ok(!path.includes(id), path.join(" → ") + " → " + id);
    for (const dependency of career.coursePreparation[id] ?? []) visit(dependency, [...path, id]);
  }
  for (const id of Object.keys(career.coursePreparation)) visit(id);
});

test("课程按内容设定不同关数，讲解、示例、练习与路由覆盖一致", () => {
  const counts = { "coding-debugging": 8, "backend-foundations": 12, "delivery-debugging": 9, "api-automation": 12, "ai-testing": 13, "quality-engineering": 11 };
  for (const [id, count] of Object.entries(counts)) {
    const course = registry.learningModules.find((item) => item.id === id);
    assert.equal(course.roadmap.length, count, id);
    const groups = chapters.blueprintChapters(course);
    assert.deepEqual(groups.flatMap((group) => group.levelIds), Array.from({ length: count }, (_, index) => index + 1));
    for (const [index, item] of course.roadmap.entries()) {
      assert.ok(item.explanation?.length > 25, id + " " + item.title);
      assert.notEqual(item.explanation, item.question);
      assert.ok(item.example && item.practice && item.evidence && item.acceptance.length >= 1);
      const group = groups.find((candidate) => candidate.levelIds.includes(index + 1));
      assert.equal(chapters.blueprintLevelHref(id, index + 1), `/courses/${id}/chapters/${group.id}#level-${index + 1}`);
    }
  }
  assert.equal(chapters.blueprintLevelHref("api-automation", 3), "/courses/api-automation/chapters/2#level-3");
  assert.throws(() => chapters.blueprintLevelHref("api-automation", 99));
});

test("离线包区分待实现任务和参考实现，五项任务均可单独运行", () => {
  const cwd = new URL("../course-starters/quality-engineering-lab/", import.meta.url);
  const reference = spawnSync("python3", ["run_tests.py", "--reference"], { cwd, encoding: "utf8" });
  assert.equal(reference.status, 0, reference.stderr);
  assert.match(reference.stdout, /REFERENCE ONLY/);
  for (const task of ["summary", "inventory", "classification", "gate", "metrics"]) {
    const learner = spawnSync("python3", ["run_tests.py", "--task", task], { cwd, encoding: "utf8" });
    assert.equal(learner.status, 1, task);
    assert.match(learner.stderr, /NotImplementedError/);
    assert.match(learner.stdout, /LEARNER IMPLEMENTATION/);
  }
});
