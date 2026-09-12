import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import test from "node:test";
import ts from "typescript";

async function loadSource(path, replace = (source) => source) {
  const source = replace(await readFile(new URL(path, import.meta.url), "utf8")).replace(/^import \{ (.+) \} from "[^"]*lesson-format";$/gm, "const { $1 } = globalThis.__lessonFormats;");
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString("base64")}#${Math.random()}`);
}

const formats = await loadSource("../app/courses/lesson-format.ts");
globalThis.__lessonFormats = formats;
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
  const api = await loadSource("../app/api/learning-chat/route.ts", (source) => 'const { getChatGPTUser, getAgentGradingRubric, getAiGradingRubric, getGradingRubric, requestDeepSeekJson } = globalThis.__aiChatTest; const { getConceptLesson } = globalThis.__lessonFormats;\n' + source.replace(/^import .+;$/gm, ""));
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
  const level8 = agentInteractive.getAgentGradingRubric(8);
  assert.deepEqual(level8.acceptance, formats.getConceptLesson("python-agent-fast-track", 8).questions.map(q => q.question));
  assert.match(level8.authoritativeNotes.join("\n"), /概念|理解检查/);
  assert.equal(agentInteractive.getAgentGradingRubric(17), null);
});

test("35 关区分概念检查和代码批改，技能练习仍需证据", async () => {
  globalThis.__frameworkReferences = await loadSource("../app/courses/python-framework/reference-answers.ts");
  const framework = await loadSource("../app/courses/python-framework/grading-rubrics.ts", source => source.replace(/^import .+;$/gm, 'const { referenceAnswers } = globalThis.__frameworkReferences;'));
  let activeRubric;
  let failBehavior = false;
  const courses = [
    ["python-agent-fast-track", 16, agentInteractive.getAgentGradingRubric],
    ["ai-developer-level5", 9, exerciseModule.getAiGradingRubric],
    ["python-framework", 10, framework.getGradingRubric],
  ];
  globalThis.__allCourseGrade = {
    getChatGPTUser: async () => ({ userId: "test" }),
    getAgentGradingRubric: agentInteractive.getAgentGradingRubric,
    getAiGradingRubric: exerciseModule.getAiGradingRubric,
    getGradingRubric: framework.getGradingRubric,
    requestDeepSeekJson: async ({ prompt }) => {
      assert.match(prompt, /不得仅因没有解释性文字、注释/);
      const contract = prompt.split('验收标准：\n')[1].split('\n<canonical_reference_answer>')[0];
      assert.doesNotMatch(contract, /能解释|能说明|能读懂|能画出|能区分/);
      return { model: "test-double", data: { reply: "按代码行为核对", grade: {
        score: 90, summary: "行为校验", strengths: [], improvements: [],
        criteria: activeRubric.acceptance.map((criterion, i) => ({ criterion, met: !(failBehavior && i === 0), evidence: "当前代码中的行为证据" })),
      } } };
    },
  };
  const api = await loadSource("../app/api/learning-chat/route.ts", source => 'const { getChatGPTUser, getAgentGradingRubric, getAiGradingRubric, getGradingRubric, requestDeepSeekJson } = globalThis.__allCourseGrade; const { getConceptLesson } = globalThis.__lessonFormats;\n' + source.replace(/^import .+;$/gm, ""));
  const ask = (courseId, id) => api.POST(new Request("https://example.test/api/learning-chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ courseId, level: { id }, answer: activeRubric.referenceAnswer, message: "请重新批改", history: [{ role: "assistant", content: "以前要求写明概念解释，没解释就不能通过。" }] }) }));
  for (const [courseId, count, rubricFor] of courses) {
    for (let id = 1; id <= count; id++) {
      activeRubric = rubricFor(id);
      assert.ok(activeRubric.acceptance.length > 0);
      const response = await ask(courseId, id);
      assert.equal(response.status, 200);
      const result = await response.json();
      if (formats.getConceptLesson(courseId, id)) { assert.equal(result.grade, null); assert.match(result.reply, /理解检查/); continue; }
      assert.equal(result.grade.passed, true, `${courseId} ${id}`);
      assert.deepEqual(result.grade.criteria.map(item => item.criterion), activeRubric.acceptance);
    }
  }
  activeRubric = agentInteractive.getAgentGradingRubric(4);
  failBehavior = true;
  const failed = await (await ask("python-agent-fast-track", 4)).json();
  assert.equal(failed.grade.passed, false);
  assert.equal(failed.grade.criteria[0].met, false);
  const queueSource = await readFile(new URL('../app/api/course-grade/route.ts', import.meta.url), 'utf8');
  assert.match(queueSource, /不得仅因没有解释性文字、注释/);
});

test("第 4 关纯代码实现隔离嵌套状态与默认 history，无需解释注释", () => {
  const lesson = agentData.agentFastTrackLessons[3];
  const code = 'from copy import deepcopy\n' + lesson.referenceAnswer + `
original = {"ticket": {"tags": ["api"]}}
first = add_history(original, "queried")
second = add_history(original, "escalated")
first["ticket"]["tags"].append("urgent")
assert original == {"ticket": {"tags": ["api"]}}
assert second["ticket"]["tags"] == ["api"]
assert first["history"] == ["queried"]
assert second["history"] == ["escalated"]
`;
  assert.ok(!code.includes('#'));
  const result = spawnSync("python3", ["-c", code], { encoding: "utf8" });
  assert.equal(result.status, 0, result.stderr);
});

test("概念课没有代码也不受旧批改限制，模型误报分数被丢弃", async () => {
  let calls = 0;
  let prompt = "";
  globalThis.__conceptChat = {
    getChatGPTUser: async () => ({ userId: "test" }),
    getConceptLesson: formats.getConceptLesson,
    getAgentGradingRubric: agentInteractive.getAgentGradingRubric,
    getAiGradingRubric: exerciseModule.getAiGradingRubric,
    getGradingRubric: () => null,
    requestDeepSeekJson: async (input) => { calls++; prompt = input.prompt; return { model: "fake", data: { reply: "环境变量解释", grade: { score: 0, summary: "缺文件", criteria: [] } } }; },
  };
  const api = await loadSource("../app/api/learning-chat/route.ts", source => 'const { getChatGPTUser, getConceptLesson, getAgentGradingRubric, getAiGradingRubric, getGradingRubric, requestDeepSeekJson } = globalThis.__conceptChat;\n' + source.replace(/^import .+;$/gm, ""));
  const ask = message => api.POST(new Request("https://example.test/api/learning-chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ courseId: "python-agent-fast-track", level: { id: 8 }, answer: "", message, history: [{ role: "assistant", content: "缺少 requirements.txt，不通过" }] }) }));
  const obsolete = await (await ask("请批改")).json();
  assert.equal(obsolete.grade, null);
  assert.equal(calls, 0);
  const explained = await (await ask("解释 get 和 []")).json();
  assert.equal(explained.grade, null);
  assert.equal(calls, 1);
  assert.match(prompt, /本节是概念课/);
  assert.doesNotMatch(prompt.split("<canonical_reference_answer>")[1].split("</canonical_reference_answer>")[0], /TODO|can_schedule/);
});

test("概念与实践的通关条件不同，概念导航跳过动手练", () => {
  assert.deepEqual(formats.lessonStepIds(true), [1, 2, 3, 5]);
  assert.deepEqual(formats.lessonStepIds(false), [1, 2, 3, 4, 5]);
  assert.equal(formats.lessonCompleted(true, true, false), true);
  assert.equal(formats.lessonCompleted(true, false, true), false);
  assert.equal(formats.lessonCompleted(false, true, false), false);
  assert.equal(formats.lessonCompleted(false, true, true), true);
  for (const [course, id] of [["python-agent-fast-track",8], ["ai-developer-level5",9], ["ui-automation",1], ["api-automation",1], ["performance-testing",1], ["quality-engineering",1], ["ai-testing",1], ["ai-testing",2]]) {
    const lesson = formats.getConceptLesson(course, id);
    assert.equal(lesson.questions.length, 3);
    for (const q of lesson.questions) assert.ok(q.options[q.correct] && q.explanation);
  }
  for (let id = 1; id <= 10; id++) assert.equal(formats.getConceptLesson("python-framework", id), undefined);
});
