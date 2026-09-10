import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";
import ts from "typescript";

async function loadSource(path, replace = (source) => source) {
  const source = replace(await readFile(new URL(path, import.meta.url), "utf8"));
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}#${Math.random()}`);
}

const agentData = await loadSource("../app/courses/python-agent-fast-track/course-data.ts");
globalThis.__agentCourseData = agentData;
const agentInteractive = await loadSource("../app/courses/python-agent-fast-track/interactive-data.ts", (source) => source.replace('import { agentFastTrackChapters, agentFastTrackLessons } from "./course-data";', 'const { agentFastTrackChapters, agentFastTrackLessons } = globalThis.__agentCourseData;'));
const plan = await loadSource("../app/ai-developer-level5/learning-plan.ts");
globalThis.__aiCoursePlan = plan;
const exerciseModule = await loadSource("../app/ai-developer-level5/exercises.ts", (source) => source.replace('import { learningStages } from "./learning-plan";', 'const { learningStages } = globalThis.__aiCoursePlan;'));

test("Agent 全部 16 节的 37 个术语有独立上下文与可解析的最小例子", () => {
  const config = agentInteractive.agentCourseConfig;
  assert.equal(config.stages.length, 16);
  let count = 0;
  for (const [index, exercise] of config.exercises.entries()) {
    assert.equal(exercise.knowledge.length, exercise.terms.length);
    const roles = new Set();
    const examples = new Set();
    for (const [term, plain] of exercise.terms) {
      const point = exercise.knowledge.find((item) => item.term === term);
      assert.ok(point, "第 " + (index + 1) + " 节缺少 " + term);
      assert.equal(point.plain, plain);
      assert.ok(point.role?.length > 10, term);
      assert.ok(point.example?.trim(), term);
      assert.notEqual(point.role, config.stages[index].explanation, term);
      assert.notEqual(point.example, exercise.example, term);
      assert.ok(!roles.has(point.role), term + " 复用了同节解释");
      assert.ok(!examples.has(point.example), term + " 复用了同节示例");
      roles.add(point.role);
      examples.add(point.example);
      // Compile only: dependencies/configuration are marked in examples.
      // Validation must not issue network requests or require secrets.
      const run = spawnSync("python3", ["-c", "import sys; compile(sys.stdin.read(), '<glossary>', 'exec')"], { input: point.example, encoding: "utf8" });
      assert.equal(run.status, 0, term + ": " + run.stderr);
      count++;
    }
  }
  assert.equal(count, 37);
  const slice = config.exercises[1].knowledge.find((item) => item.term === "切片");
  assert.match(slice.example, /ticket_id\[0:2\]/);
  assert.match(slice.role, /没有直接用切片/);
  const run = spawnSync("python3", ["-c", slice.example], { encoding: "utf8" });
  assert.equal(run.status, 0, run.stderr);
  assert.deepEqual(run.stdout.trim().split("\n"), ["101", "T-", "11"]);
});

test("公共弹窗优先使用术语专属内容，同时兼容未迁移课程", async () => {
  const source = await readFile(new URL("../app/ai-developer-level5/AiDeveloperCourse.tsx", import.meta.url), "utf8");
  assert.match(source, /exercise\.knowledge\?\.find\(\(point\) => point\.term === term\) \?\?/);
});

test("九节练习参考答案可执行，小测选项与关卡材料有效", () => {
  assert.equal(exerciseModule.exercises.length, plan.learningStages.length);
  for (const [index, exercise] of exerciseModule.exercises.entries()) {
    assert.ok(exercise.quiz.options[exercise.quiz.correct]);
    assert.ok(exercise.walkthrough.length >= 3);
    const run = spawnSync("python3", ["-c", exercise.reference], { encoding: "utf8" });
    assert.equal(run.status, 0, `第 ${index + 1} 节参考答案：${run.stderr}`);
  }
  assert.equal(exerciseModule.getAiGradingRubric(0), null);
  assert.equal(exerciseModule.getAiGradingRubric(10), null);
});

test("进度 API 按账号和课程隔离，保留旧课程默认值并拒绝冲突", async () => {
  const rows = new Map();
  let user = { userId: "account-a" };
  globalThis.__aiSyncTest = {
    getChatGPTUser: async () => user,
    env: { DB: { prepare(sql) {
      return { bind(...args) {
        return {
          async first() {
            if (sql.startsWith("SELECT")) return rows.get(`${args[0]}:${args[1]}`) ?? null;
            if (sql.startsWith("UPDATE")) {
              const key = `${args[1]}:${args[2]}`;
              const old = rows.get(key);
              if (!old || old.revision !== args[3]) return null;
              const next = { state_json: args[0], revision: old.revision + 1, updated_at: "2026-09-08" };
              rows.set(key, next); return next;
            }
          },
          async run() {
            if (sql.startsWith("INSERT")) rows.set(`${args[0]}:${args[1]}`, { state_json: args[2], revision: 1, updated_at: "2026-09-08" });
            if (sql.startsWith("DELETE")) rows.delete(`${args[0]}:${args[1]}`);
          },
        };
      }, async run() {} };
    } } },
  };
  const api = await loadSource("../app/api/learning-sync/route.ts", (source) => source.replace(/import \{ env \} from "cloudflare:workers";/, 'const { env } = globalThis.__aiSyncTest;').replace(/import \{ getChatGPTUser \} from "..\/..\/chatgpt-auth";/, 'const { getChatGPTUser } = globalThis.__aiSyncTest;'));
  const url = "https://example.test/api/learning-sync";
  const payload = (courseId, completed, baseRevision = 0) => ({ courseId, baseRevision, state: { progress: { completed }, chats: {}, clocks: {} } });
  const put = (query, value) => api.PUT(new Request(url + query, { method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(value) }));
  assert.equal((await put("", payload("python-framework", [10]))).status, 200);
  assert.equal((await put("?courseId=ai-developer-level5", payload("ai-developer-level5", [1]))).status, 200);
  assert.equal((await put("?courseId=python-agent-fast-track", payload("python-agent-fast-track", [11, 16]))).status, 200);
  assert.deepEqual((await (await api.GET(new Request(url + "?courseId=python-agent-fast-track"))).json()).state.progress.completed, [11, 16]);
  const original = await (await api.GET(new Request(url))).json();
  const ai = await (await api.GET(new Request(url + "?courseId=ai-developer-level5"))).json();
  assert.deepEqual(original.state.progress.completed, [10]);
  assert.deepEqual(ai.state.progress.completed, [1]);
  assert.equal((await put("?courseId=ai-developer-level5", payload("ai-developer-level5", [2], 0))).status, 409);
  assert.equal((await put("?courseId=ai-developer-level5", payload("python-framework", [2], 1))).status, 400);
  assert.equal((await api.GET(new Request(url + "?courseId=unknown"))).status, 400);
  user = { userId: "account-b" };
  assert.equal((await (await api.GET(new Request(url + "?courseId=ai-developer-level5"))).json()).state, null);
  user = null;
  assert.equal((await api.GET(new Request(url))).status, 401);
  assert.equal((await put("", payload("python-framework", []))).status, 401);
  user = { userId: "account-a" };
  await api.DELETE(new Request(url + "?courseId=ai-developer-level5", { method: "DELETE" }));
  assert.deepEqual((await (await api.GET(new Request(url))).json()).state.progress.completed, [10]);
});

test("在线助教依据课程选择服务端题目，概念提问不强制先写答案", async () => {
  let capturedPrompt = "";
  let calls = 0;
  globalThis.__aiChatTest = {
    getChatGPTUser: async () => ({ userId: "test" }),
    getAiGradingRubric: exerciseModule.getAiGradingRubric,
    getAgentGradingRubric: agentInteractive.getAgentGradingRubric,
    getGradingRubric: () => ({ levelId: 1, title: "旧课数据访问", task: "get_by_path", taskContract: [], acceptance: [], referenceAnswer: "old reference" }),
    requestDeepSeekJson: async ({ prompt }) => { calls += 1; capturedPrompt = prompt; return { data: { reply: "练习反馈", grade: null }, model: "test-double" }; },
  };
  const api = await loadSource("../app/api/learning-chat/route.ts", (source) => 'const { getChatGPTUser, getAgentGradingRubric, getAiGradingRubric, getGradingRubric, requestDeepSeekJson } = globalThis.__aiChatTest;\n' + source.replace(/^import .+;$/gm, ""));
  const ask = (body) => api.POST(new Request("https://example.test/api/learning-chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
  assert.equal((await ask({ courseId: "ai-developer-level5", level: { id: 1 }, message: "什么是字典？", answer: "" })).status, 200);
  assert.match(capturedPrompt, /find_records/);
  assert.equal((await ask({ courseId: "python-agent-fast-track", level: { id: 16 }, message: "怎样测试？", answer: "" })).status, 200);
  assert.match(capturedPrompt, /毕业任务/);
  assert.doesNotMatch(capturedPrompt, /find_records/);
  assert.doesNotMatch(capturedPrompt, /get_by_path/);
  const lesson3 = agentData.agentFastTrackLessons[2];
  assert.equal((await ask({ courseId: "python-agent-fast-track", level: { id: 3 }, message: "请批改", answer: lesson3.referenceAnswer })).status, 200);
  assert.match(capturedPrompt, /不得仅因缺少解释而扣分或判定不通过/);
  assert.doesNotMatch(capturedPrompt, /能解释短路求值/);
  assert.match(lesson3.starter, /文字解释或注释不是通过条件/);
  assert.deepEqual(agentInteractive.agentCourseConfig.exercises[2].acceptance, agentInteractive.getAgentGradingRubric(3).acceptance);
  assert.equal((await ask({ level: { id: 1 }, message: "请给提示", answer: "x".repeat(35) })).status, 200);
  assert.match(capturedPrompt, /get_by_path/);
  assert.equal((await ask({ courseId: "unknown", level: { id: 1 }, message: "提示" })).status, 400);
  assert.equal((await ask({ courseId: "ai-developer-level5", level: { id: 10 }, message: "提示" })).status, 404);
  assert.equal(calls, 4);
});


test("Agent 十六节小测匹配诊断，旧进度迁移与冲突合并不丢失末节", async () => {
  const sync = await loadSource("../app/courses/python-framework/learning-sync.ts");
  globalThis.__agentSync = sync;
  const { importAgentLegacyState } = await loadSource("../app/courses/python-agent-fast-track/legacy-progress.ts", (source) => source.replace(/^import .+;$/m, "const { stampLearningState } = globalThis.__agentSync;"));
  const storage = { getItem: (key) => key.endsWith("completed-v1") ? "[1,11,16,99]" : key.endsWith(":16") ? "my final project" : null };
  const imported = importAgentLegacyState(sync.emptyLearningState(), storage);
  assert.deepEqual(imported.progress.completed, [1, 11, 16]);
  assert.deepEqual(imported.progress.quizPassed, []); // Legacy self-report is not a new quiz pass.
  assert.equal(imported.progress.taskDrafts[16], "my final project");
  assert.equal(importAgentLegacyState(imported, storage), imported);
  assert.deepEqual(sync.mergeLearningStates(imported, sync.emptyLearningState()).progress.completed, [1, 11, 16]);
  const edited = sync.stampLearningState({ ...imported, progress: { ...imported.progress, completed: [1, 11], taskDrafts: { 16: "new cloud draft" } } }, ["progress.completed.16", "progress.taskDrafts.16"], "2099-01-01T00:00:00.000Z");
  assert.deepEqual(sync.mergeLearningStates(imported, edited).progress.completed, [1, 11]);
  assert.equal(importAgentLegacyState(edited, storage).progress.taskDrafts[16], "new cloud draft");
  for (const [index, exercise] of agentInteractive.agentCourseConfig.exercises.entries()) {
    assert.equal(exercise.quiz.options.length, 3);
    assert.equal(new Set(exercise.quiz.options).size, 3);
    assert.equal(exercise.quiz.options[exercise.quiz.correct], agentData.agentFastTrackLessons[index].diagnostic.answer);
    assert.equal(exercise.starter, agentData.agentFastTrackLessons[index].starter);
    assert.ok(exercise.terms.length >= 2 && exercise.walkthrough.length >= 3);
  }
  assert.equal(agentInteractive.getAgentGradingRubric(17), null);
});
