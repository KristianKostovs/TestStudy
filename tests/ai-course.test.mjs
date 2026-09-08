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

const plan = await loadSource("../app/ai-developer-level5/learning-plan.ts");
globalThis.__aiCoursePlan = plan;
const exerciseModule = await loadSource("../app/ai-developer-level5/exercises.ts", (source) => source.replace('import { learningStages } from "./learning-plan";', 'const { learningStages } = globalThis.__aiCoursePlan;'));

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
    getGradingRubric: () => ({ levelId: 1, title: "旧课数据访问", task: "get_by_path", taskContract: [], acceptance: [], referenceAnswer: "old reference" }),
    requestDeepSeekJson: async ({ prompt }) => { calls += 1; capturedPrompt = prompt; return { data: { reply: "练习反馈", grade: null }, model: "test-double" }; },
  };
  const api = await loadSource("../app/api/learning-chat/route.ts", (source) => 'const { getChatGPTUser, getAiGradingRubric, getGradingRubric, requestDeepSeekJson } = globalThis.__aiChatTest;\n' + source.replace(/^import .+;$/gm, ""));
  const ask = (body) => api.POST(new Request("https://example.test/api/learning-chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) }));
  assert.equal((await ask({ courseId: "ai-developer-level5", level: { id: 1 }, message: "什么是字典？", answer: "" })).status, 200);
  assert.match(capturedPrompt, /find_records/);
  assert.doesNotMatch(capturedPrompt, /get_by_path/);
  assert.equal((await ask({ level: { id: 1 }, message: "请给提示", answer: "x".repeat(35) })).status, 200);
  assert.match(capturedPrompt, /get_by_path/);
  assert.equal((await ask({ courseId: "unknown", level: { id: 1 }, message: "提示" })).status, 400);
  assert.equal((await ask({ courseId: "ai-developer-level5", level: { id: 10 }, message: "提示" })).status, 404);
  assert.equal(calls, 2);
});
