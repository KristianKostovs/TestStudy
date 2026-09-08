import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    {
      ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("AI 开发 5 级专区可直接访问，学习与项目锚点完整且不载入其他课程关卡", async () => {
  const response = await render("/ai-developer-level5");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>5 级 AI 开发岗学习路线 \| 测试能力修炼场<\/title>/);
  for (const anchor of ["requirements", "foundations", "python", "data", "api", "model", "rag", "agent", "delivery", "training", "infrastructure", "projects", "evidence", "resources"]) {
    assert.match(html, new RegExp(`id=["']${anchor}["']`));
    assert.match(html, new RegExp(`href=["']#${anchor}["']`));
  }
  assert.match(html, /不计入其他课程的关卡、进度或面试评分/);
  assert.match(html, /前置知识/);
  assert.match(html, /自检要求与成果材料/);
  assert.match(html, /不是公司新增门槛/);
  assert.doesNotMatch(html, /id=["']level-1["']|name=["']answer["']/);
  const learningHome = await (await render("/learn")).text();
  assert.match(learningHome, /独立岗位学习专区/);
  assert.match(learningHome, /href=["']\/ai-developer-level5["']/);
});

test("首页是学习、面试和技术雷达的统一成长总览", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /<title>测试能力修炼场<\/title>/);
  assert.match(html, /都回到同一张成长地图/);
  assert.match(html, /href=["']\/learn["']/);
  assert.match(html, /href=["']\/interview["']/);
  assert.match(html, /href=["']\/radar["']/);
  assert.match(html, /成长档案/);
  assert.doesNotMatch(html, /id=["']level-1["']/);
});

test("学习中心只负责选择独立课程方向", async () => {
  const response = await render("/learn");
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /<title>学习中心 \| 测试能力修炼场<\/title>/);
  assert.match(html, /先选方向/);
  for (const moduleId of [
    "python-framework",
    "python-agent-fast-track",
    "ui-automation",
    "api-automation",
    "ai-testing",
    "performance-testing",
    "quality-engineering",
  ]) {
    assert.match(html, new RegExp(`href=["']/courses/${moduleId}["']`));
  }
  assert.doesNotMatch(html, /id=["']level-1["']/);
});

test("各方向拥有可独立访问的课程页面", async () => {
  const cases = [
    ["/courses/python-framework", "Python 框架基础十关"],
    ["/courses/python-agent-fast-track", "Python 基础 Agent 快速通道"],
    ["/courses/ui-automation", "UI 自动化十关路线"],
    ["/courses/api-automation", "API 自动化十关路线"],
    ["/courses/ai-testing", "AI 测试十关路线"],
    ["/courses/performance-testing", "性能测试十关路线"],
    ["/courses/quality-engineering", "质量工程与保障十关路线"],
  ];

  for (const [pathname, expectedTitle] of cases) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    const html = await response.text();
    assert.match(html, new RegExp(`<title>${expectedTitle} \\| 测试能力修炼场<\\/title>`), pathname);
    assert.match(html, /href=["']\/learn["']/, pathname);
  }
});

test("Python Agent 快速通道提供完整十六节学习内容和连续工单项目", async () => {
  const [data, client, registry, styles] = await Promise.all([
    readFile(new URL("../app/courses/python-agent-fast-track/course-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/courses/python-agent-fast-track/AgentFastTrackClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/learning-registry.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/courses/python-agent-fast-track/python-agent-fast-track.css", import.meta.url), "utf8"),
  ]);

  assert.equal((data.match(/\n {4}id: \d+,\n {4}chapter: \d+,/g) ?? []).length, 16);
  assert.equal((data.match(/\n {4}objective:/g) ?? []).length, 16);
  assert.equal((data.match(/\n {4}diagnostic:/g) ?? []).length, 16);
  assert.equal((data.match(/\n {4}starter:/g) ?? []).length, 16);
  assert.equal((data.match(/\n {4}referenceAnswer:/g) ?? []).length, 16);
  assert.equal((data.match(/\n {4}pass:/g) ?? []).length, 16);
  assert.equal((data.match(/\n {4}lookupOnly:/g) ?? []).length, 2);
  for (const topic of ["可变默认参数", "is、== 与 None", "Pydantic", "TypedDict、Annotated", "async/await 与 yield", "LangChain 工具", "LangGraph 状态", "工单查询 Agent"]) {
    assert.match(data, new RegExp(topic.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(data, /totalAgentFastTrackMinutes = 1760/);
  assert.match(client, /参考答案与解释（默认折叠）/);
  assert.match(client, /<BlueprintPracticeEditor/);
  assert.match(client, /我已独立完成并达到标准/);
  assert.match(client, /下一步入口/);
  assert.match(client, /这一节只掌握用法即可/);
  assert.match(client, /python-agent-fast-track-completed-v1/);
  assert.match(registry, /id: "python-agent-fast-track"/);
  assert.match(registry, /foundation\.langchain/);
  assert.match(registry, /foundation\.langgraph/);
  assert.match(styles, /font-size: 16px/);

  const response = await render("/courses/python-agent-fast-track");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Python 基础 Agent 快速通道/);
  assert.match(html, /工单查询助手/);
  assert.match(html, /最小可运行示例/);
  assert.match(html, /输出是什么，或错误在哪里/);
  assert.match(html, /IDE 练习区/);
  assert.match(html, /TODO（你来完成）/);
});

test("详情页不会错误继承首页分享图", async () => {
  const pythonHtml = await (await render("/courses/python-framework")).text();
  assert.match(pythonHtml, /og\.png/);
  assert.doesNotMatch(pythonHtml, /og-platform\.png/);

  const uiHtml = await (await render("/courses/ui-automation")).text();
  assert.doesNotMatch(uiHtml, /og-platform\.png|og\.png/);
});

test("Python 课程拆成总览与四个独立章节页面", async () => {
  const overview = await (await render("/courses/python-framework")).text();
  assert.match(overview, /第一章 · 筑基/);
  assert.match(overview, /第二章 · 入阵/);
  assert.match(overview, /第三章 · 破阵/);
  assert.match(overview, /终章 · 出师/);
  for (const chapterId of [1, 2, 3, 4]) {
    const response = await render(`/courses/python-framework/chapters/${chapterId}`);
    assert.equal(response.status, 200, `chapter ${chapterId}`);
  }
});

test("Python 关卡使用在线 DeepSeek 助教并保留本机 Codex 与在线备用路径", async () => {
  const source = await readFile(new URL("../app/courses/python-framework/PythonCourseClient.tsx", import.meta.url), "utf8");
  const editor = await readFile(new URL("../app/courses/python-framework/PythonAnswerEditor.tsx", import.meta.url), "utf8");
  const courseStyles = await readFile(new URL("../app/courses/python-framework/course-flow.css", import.meta.url), "utf8");
  const route = await readFile(new URL("../app/api/course-grade/route.ts", import.meta.url), "utf8");
  const learningChatRoute = await readFile(new URL("../app/api/learning-chat/route.ts", import.meta.url), "utf8");
  const queue = await readFile(new URL("../app/grading-queue/GradingQueueClient.tsx", import.meta.url), "utf8");
  const bridge = await readFile(new URL("../local-companion/server.mjs", import.meta.url), "utf8");
  const launcher = await readFile(new URL("../启动本地Codex学习站.command", import.meta.url), "utf8");
  const localSiteAgent = await readFile(new URL("../deploy/com.baiyi.python-framework-quest-site.plist", import.meta.url), "utf8");
  const viteConfig = await readFile(new URL("../vite.config.ts", import.meta.url), "utf8");

  assert.match(source, /const learningStages = \["先认词", "看数据", "逐行理解", "动手练", "自动小测"\]/);
  assert.match(source, /<PythonAnswerEditor/);
  assert.match(editor, /@codemirror\/lang-python/);
  assert.match(editor, /indentUnit\.of\(" {4}"\)/);
  assert.match(editor, /keymap\.of\(\[indentWithTab\]\)/);
  assert.match(editor, /autocompletion/);
  assert.match(editor, /lintGutter/);
  assert.match(editor, /collectPythonDiagnostics/);
  assert.match(editor, /上一行以冒号结尾/);
  assert.match(editor, /你是不是想写/);
  assert.match(editor, /最新版框架已载入/);
  assert.match(editor, /恢复最新版框架/);
  assert.match(source, /course-workspace/);
  assert.match(source, /suite-topbar course-suite-topbar/);
  assert.match(courseStyles, /\.code-editor-statusbar/);
  assert.match(courseStyles, /\.editor-problems/);
  assert.match(courseStyles, /\.course-workspace[\s\S]*font-family: var\(--font-geist-sans\)/);
  assert.match(courseStyles, /\.course-workspace \.chapter-card[\s\S]*border-radius: 15px/);
  assert.match(source, /fetch\("\/api\/course-grade"/);
  assert.match(source, /action: "enqueue"/);
  assert.match(source, /answerForLevel\(id, taskDraftsRef\.current\)/);
  assert.match(source, /answerForLevel\(level\.id, taskDraftsRef\.current\)/);
  assert.match(source, /history: includeHistory \? previous : \[\]/);
  assert.match(source, /sendToTutor\(level, "请批改我当前的答案[^\n]+", false\)/);
  assert.match(source, /gradeSubmission\?\.answer\.trim\(\) === currentDraft\.trim\(\)/);
  assert.match(source, /待评判/);
  assert.match(source, /评判中/);
  assert.match(source, /已完成/);
  assert.match(route, /const gradingMode = "deepseek_online"/);
  assert.match(route, /course_grading_submissions/);
  assert.match(route, /requestDeepSeekJson/);
  assert.match(route, /action === "grade"/);
  assert.match(route, /<current_student_answer>/);
  assert.match(learningChatRoute, /唯一最新版/);
  assert.ok(
    learningChatRoute.indexOf("<conversation_history>") < learningChatRoute.indexOf("<current_student_answer>"),
    "当前答案必须放在旧对话历史之后，防止模型把历史答案当作最新版",
  );
  assert.doesNotMatch(route, /action === "claim"|action === "complete"|api\.openai\.com/);
  assert.match(queue, /重新交给 DeepSeek 批改/);
  assert.match(queue, /课程里的即时对话和备用提交都由同一个 DeepSeek 服务评判/);
  assert.doesNotMatch(queue, /navigator\.clipboard|粘贴 Codex 返回/);
  assert.match(source, /localCodexBridge/);
  assert.doesNotMatch(source, /codexPluginUrl/);
  assert.match(source, /网页尚未连上本机 Codex/);
  assert.match(source, /requestInit\.targetAddressSpace = "local"/);
  assert.match(source, /允许并重新连接/);
  assert.match(source, /检查本机服务/);
  assert.match(source, /本地网络访问/);
  assert.match(source, /checkLocalCodex\(20_000, true\)/);
  assert.match(source, /进入本机学习模式/);
  assert.match(source, /python-framework-quest-local-transfer-v1/);
  assert.match(source, /window\.location\.assign\(localLearningUrl\)/);
  assert.match(source, /`\/local-codex\$\{path\}`/);
  assert.match(source, /本机 Codex 已连接/);
  assert.match(source, /立即批改当前答案/);
  assert.match(source, /继续和\{tutorName\}对话/);
  assert.match(bridge, /"exec"/);
  assert.match(bridge, /"--ephemeral"/);
  assert.match(bridge, /model_reasoning_effort/);
  assert.match(bridge, /"--sandbox", "read-only"/);
  assert.match(bridge, /Logged in/);
  assert.match(bridge, /python-framework-quest\.leafy-slug-3142\.chatgpt\.site/);
  assert.match(launcher, /node local-companion\/server\.mjs/);
  assert.match(localSiteAgent, /127\.0\.0\.1/);
  assert.match(localSiteAgent, /<string>3000<\/string>/);
  assert.match(localSiteAgent, /KeepAlive/);
  assert.match(viteConfig, /"\/local-codex"/);
  assert.match(viteConfig, /127\.0\.0\.1:4317/);

  const response = await render("/grading-queue");
  assert.equal(response.status, 200);
});

test("Python 十关在参考答案前补齐必需基础知识且答案覆盖完整任务", async () => {
  const [source, answers, rubric, editor] = await Promise.all([
    readFile(new URL("../app/courses/python-framework/PythonCourseClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/courses/python-framework/reference-answers.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/courses/python-framework/grading-rubrics.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/courses/python-framework/PythonAnswerEditor.tsx", import.meta.url), "utf8"),
  ]);

  assert.equal((source.match(/\n {4}answerPrerequisites:/g) ?? []).length, 10);
  assert.equal((source.match(/\n {4}taskContext:/g) ?? []).length, 10);
  assert.equal((source.match(/\n {4}taskContract:/g) ?? []).length, 10);
  assert.match(source, /写答案前必须会/);
  assert.match(source, /field[\s\S]*default_factory[\s\S]*可变默认值/);
  assert.match(answers, /from dataclasses import dataclass, field[\s\S]*def adjust_stock_action[\s\S]*-> ActionResult/);
  assert.match(answers, /@pytest\.mark\.parametrize/);
  assert.match(answers, /class FlowEntry\(BaseModel\)[\s\S]*test_empty_entry_is_rejected/);
  assert.match(answers, /def run_entry\(entry, adapters, context\)[\s\S]*context\["resolved_fixture"\]/);
  assert.match(answers, /httpx\.MockTransport\(handler\)[\s\S]*business_error/);
  assert.match(source, /taskContext: "背景：生产代码会用 HTTPX 调用库存调整接口/);
  assert.equal((source.match(/TODO（你来完成）/g) ?? []).length >= 10, true);
  assert.match(source, /function answerForLevel[\s\S]*hasOwnProperty[\s\S]*supportByLevel\[id\]\.starter/);
  assert.match(source, /legacyStarterByLevel[\s\S]*savedDraft\.trim\(\) === legacyStarterByLevel\[id\]\?\.trim\(\)/);
  assert.match(source, /requirements\/BOSS_01\/[\s\S]*constraint_spec\.yaml[\s\S]*source_queries\.py/);
  assert.match(source, /value=\{currentDraft\}/);
  assert.match(source, /框架代码已经放进编辑器/);
  assert.match(source, /requirements\/BOSS_01\/requirement_cases\.yaml[\s\S]*requirements\/BOSS_01\/adapters\.py[\s\S]*tests\/test_boss_mock\.py[\s\S]*evidence\/boss_01_after_sale\.json/);
  assert.match(source, /请求 JSON：[\s\S]*skuId[\s\S]*adjustAmount=10[\s\S]*SYSTEM_ERROR[\s\S]*A4500/);
  assert.match(answers, /request\.method == "POST"[\s\S]*payload\["skuId"\] == "SKU-001"/);
  assert.match(editor, /request\.url[\s\S]*status_code[\s\S]*MockTransport[\s\S]*补全不会自动导入第三方库/);
  for (const completion of ["@pytest.fixture", "@pytest.mark.parametrize", "@dataclass", "model_validator", "signature", "common_flow"]) {
    assert.match(editor, new RegExp(completion.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(editor, /extensions: \[[\s\S]*basicSetup,[\s\S]*python\(\),/);
  assert.match(editor, /本关保留 Python 语法高亮、自动缩进和代码补全/);
  assert.match(editor, /补全只展示名称，不会自动导入/);
  assert.equal((rubric.match(/taskContract:/g) ?? []).length, 11);
  assert.match(rubric, /请求结构由题目明确给定，不得要求学习者猜测未声明字段/);
  assert.match(answers, /requirement_cases\.yaml[\s\S]*teardown:[\s\S]*always:/);
  assert.match(rubric, /action 明确返回并构造 ActionResult/);

  const supportTable = source.slice(source.indexOf("const supportByLevel"), source.indexOf("const legacyStarterByLevel"));
  const level10Support = supportTable.slice(supportTable.indexOf("  10: {"));
  const level10Answer = answers.slice(answers.indexOf("  10: `"));
  for (const actionName of ["fixture.resolve", "inventory.snapshot", "request.build", "stock.adjust", "fixture.restore"]) {
    assert.match(level10Support, new RegExp(actionName.replace(".", "\\.")));
    assert.match(level10Answer, new RegExp(actionName.replace(".", "\\.")));
  }
  assert.doesNotMatch(level10Support, /after_sale\.notify|client\.close/);
  assert.doesNotMatch(level10Answer, /after_sale\.notify|client\.close/);
  assert.match(level10Answer, /def validate_flow[\s\S]*def run_flow[\s\S]*SYSTEM_ERROR/);
  assert.match(editor, /恢复最新版框架代码会替换当前编辑内容[\s\S]*恢复最新版框架/);
});

test("第十关通关后解锁完整的 pytest 框架 HTML 笔记", async () => {
  const [course, rewardPage, rewardStyles] = await Promise.all([
    readFile(new URL("../app/courses/python-framework/PythonCourseClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/courses/python-framework/rewards/framework-flow-notes/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/courses/python-framework/rewards/framework-flow-notes/reward-notes.css", import.meta.url), "utf8"),
  ]);

  assert.match(course, /level\.id === 10 && done/);
  assert.match(course, /href="\/courses\/python-framework\/rewards\/framework-flow-notes"/);
  assert.match(course, /打开 HTML 通关笔记/);
  for (const detail of [
    "yaml_collector.py",
    "FlowEntry",
    "pytest --collect-only",
    "db_connection fixture",
    "MockTransport",
    "teardown.always",
    "ActionResult",
    "evidence.json",
    "fixture.restore",
    "DATABASE_URL",
    "技术范围维度",
    "业务归属维度",
    "test_action_contract.py",
    "@pytest.mark.integration",
  ]) {
    assert.match(rewardPage, new RegExp(detail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
  assert.match(rewardPage, /Requirement → Shared Action → Provider \/ Client/);
  assert.match(rewardPage, /真实密码、Token 和生产连接串/);
  assert.match(rewardPage, /前三类按测试范围划分，requirements 按业务归属划分/);
  assert.match(rewardPage, /同一个测试可以同时拥有两种属性/);
  assert.match(rewardPage, /href="\/courses\/python-framework\/chapters\/4#level-10"/);
  assert.match(rewardStyles, /\.flow-map::before/);
  assert.match(rewardStyles, /@media \(max-width: 720px\)/);

  const response = await render("/courses/python-framework/rewards/framework-flow-notes");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /声明式 pytest 框架/);
  assert.match(html, /可落地的完整 pytest 工程结构/);
  assert.match(html, /配置数据库的完整依赖链/);
});

test("所有学习模块都展示课题背景、固定练习契约和验收标准", async () => {
  const [roadmaps, registry, page, starters, editor, chatRoute, gradeRoute] = await Promise.all([
    readFile(new URL("../app/blueprint-roadmaps.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/learning-registry.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/courses/[moduleId]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/blueprint-starters.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/courses/BlueprintPracticeEditor.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/learning-chat/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/course-grade/route.ts", import.meta.url), "utf8"),
  ]);

  assert.match(registry, /缺少背景、任务、契约或验收标准/);
  assert.match(page, /课题背景/);
  assert.match(page, /固定契约/);
  assert.match(page, /验收标准/);
  assert.match(page, /项目练习默认方式/);
  assert.match(page, /目录、字段、函数签名、固定样例和测试入口/);
  assert.match(page, /默认项目框架已放入 IDE/);
  assert.match(page, /<BlueprintPracticeEditor/);
  assert.match(editor, /learning-blueprint-draft-v1/);
  assert.match(editor, /window\.localStorage\.setItem/);
  assert.match(editor, /恢复默认框架/);
  assert.match(editor, /只需完成 TODO（你来完成）/);
  for (const seedGroup of ["uiSeeds", "apiSeeds", "aiSeeds", "performanceSeeds", "qualitySeeds"]) {
    assert.match(starters, new RegExp(`const ${seedGroup}: StarterSeed\\[\\] = \\[`));
  }
  assert.match(chatRoute, /rubric\.taskContract/);
  assert.match(gradeRoute, /rubric\.taskContract/);
  for (const topic of ["Locator 基础", "接口链字段绑定", "P50/P95/P99", "覆盖率与覆盖率误区"]) {
    assert.match(roadmaps, new RegExp(topic));
  }

  for (const moduleId of ["ui-automation", "api-automation", "ai-testing", "performance-testing", "quality-engineering"]) {
    const html = await (await render(`/courses/${moduleId}`)).text();
    assert.equal((html.match(/<dt>固定契约<\/dt>/g) ?? []).length, 10, moduleId);
    assert.equal((html.match(/<dt>验收标准<\/dt>/g) ?? []).length, 10, moduleId);
    assert.equal((html.match(/<section class="blueprint-practice"/g) ?? []).length, 10, moduleId);
    assert.equal((html.match(/<div class="blueprint-editor-shell"/g) ?? []).length, 10, moduleId);
    assert.match(html, /TODO（你来完成）/);
    assert.doesNotMatch(html, /将补齐：基础解释/);
  }
});

test("Level 5 批改遵循 collect-only 的真实生命周期而不是模型猜测", async () => {
  const source = await readFile(new URL("../app/courses/python-framework/PythonCourseClient.tsx", import.meta.url), "utf8");
  const rubric = await readFile(new URL("../app/courses/python-framework/grading-rubrics.ts", import.meta.url), "utf8");
  const chatRoute = await readFile(new URL("../app/api/learning-chat/route.ts", import.meta.url), "utf8");
  const gradeRoute = await readFile(new URL("../app/api/course-grade/route.ts", import.meta.url), "utf8");

  assert.match(source, /collect-only 会导入测试模块[\s\S]*不会执行普通 fixture 的 setup、yield、teardown/);
  assert.match(rubric, /不得仅凭猜测 HttpClient 构造函数可能联网而扣分/);
  assert.match(chatRoute, /权威判定说明（优先于对话历史和模型猜测）/);
  assert.match(gradeRoute, /权威判定说明（优先于模型猜测）/);
});

test("DeepSeek 明确索要答案时给完整正确答案并在两条批改路径进行复核", async () => {
  const [source, answers, rubric, chatRoute, gradeRoute, provider] = await Promise.all([
    readFile(new URL("../app/courses/python-framework/PythonCourseClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/courses/python-framework/reference-answers.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/courses/python-framework/grading-rubrics.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/learning-chat/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/course-grade/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/deepseek.ts", import.meta.url), "utf8"),
  ]);

  assert.equal((source.match(/referenceAnswer: referenceAnswers\[/g) ?? []).length, 10);
  assert.equal((answers.match(/^ {2}\d+: `/gm) ?? []).length, 10);
  assert.match(rubric, /referenceAnswer: referenceAnswers\[rubric\.levelId\]/);
  assert.match(chatRoute, /response_mode=full_answer/);
  assert.match(chatRoute, /不得以助教引导为由拒绝、拖延或只给提示/);
  assert.match(chatRoute, /previous_judgment_wrong/);
  assert.match(chatRoute, /我重新核对后发现之前的判断有误/);
  assert.match(gradeRoute, /独立做第二遍复核/);
  assert.match(gradeRoute, /canonical_reference_answer/);
  assert.match(provider, /attempt\.thinking \? "enabled" : "disabled"/);
  assert.match(provider, /attempts\.push\(\{ thinking: false/);
  assert.match(provider, /parseDeepSeekEnvelope/);
  assert.match(provider, /response\.text\(\)/);
  assert.match(provider, /startsWith\("data:"\)/);
  assert.match(provider, /空或非 JSON 响应/);
  assert.match(provider, /自动重试后仍未恢复/);
  assert.match(chatRoute, /maxTokens: 8_000, thinking: true, reasoningEffort: "low"/);
  assert.match(gradeRoute, /maxTokens: 6_000, thinking: true, reasoningEffort: "low"/);
});

test("DeepSeek 凭据只在受保护的统一服务层使用", async () => {
  const [source, route, courseGrade, provider] = await Promise.all([
    readFile(new URL("../app/courses/python-framework/PythonCourseClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/learning-chat/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/course-grade/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/deepseek.ts", import.meta.url), "utf8"),
  ]);

  assert.match(source, /fetch\(chatUrl, requestInit\)/);
  assert.match(source, /"\/api\/learning-chat"/);
  assert.match(source, /DeepSeek 在线助教已启用/);
  assert.doesNotMatch(source, /DEEPSEEK_API_KEY|api\.deepseek\.com|Bearer/);
  assert.match(route, /getChatGPTUser/);
  assert.match(route, /requestDeepSeekJson/);
  assert.doesNotMatch(route, /DEEPSEEK_API_KEY|api\.deepseek\.com|Bearer/);
  assert.match(route, /score >= 75 && criteria\.every/);
  assert.match(courseGrade, /requestDeepSeekJson/);
  assert.doesNotMatch(courseGrade, /DEEPSEEK_API_KEY|api\.deepseek\.com|Bearer/);
  assert.match(provider, /DEEPSEEK_API_KEY/);
  assert.match(provider, /https:\/\/api\.deepseek\.com\/chat\/completions/);
  assert.match(provider, /deepseek-v4-flash/);
  assert.match(provider, /response_format: \{ type: "json_object" \}/);
  assert.match(provider, /thinking: \{ type: attempt\.thinking \? "enabled" : "disabled" \}/);
  assert.match(provider, /\[已隐藏\]/);
});

test("Python 学习进度按 ChatGPT 账户同步且保留本机缓存", async () => {
  const [source, syncRoute, syncMerge, schema, migration] = await Promise.all([
    readFile(new URL("../app/courses/python-framework/PythonCourseClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/learning-sync/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/courses/python-framework/learning-sync.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0004_curious_james_howlett.sql", import.meta.url), "utf8"),
  ]);

  assert.match(source, /fetch\("\/api\/learning-sync"/);
  assert.match(source, /python-framework-quest-sync-meta-v1/);
  assert.match(source, /已同步到账号 · 换电脑登录即可继续/);
  assert.match(source, /本机已保存/);
  assert.match(source, /method: "DELETE"/);
  assert.match(syncRoute, /getChatGPTUser/);
  assert.doesNotMatch(syncRoute, /site-owner/);
  assert.match(syncRoute, /baseRevision/);
  assert.match(syncRoute, /status: 409/);
  assert.match(syncRoute, /owner_id = \? AND course_id = \?/);
  assert.match(syncMerge, /mergeLearningStates/);
  assert.match(syncMerge, /progress\.taskDrafts\.\$\{levelId\}/);
  assert.match(schema, /courseLearningStates/);
  assert.match(migration, /PRIMARY KEY\(`owner_id`, `course_id`\)/);
});

test("每关学习笔记支持账号目录、图片存储并汇总到成长档案", async () => {
  const [course, panel, noteRoute, imageUpload, imageRead, schema, migration, hosting, growth] = await Promise.all([
    readFile(new URL("../app/courses/python-framework/PythonCourseClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/courses/python-framework/CourseNotePanel.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/course-notes/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/course-note-images/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/api/course-note-image/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../drizzle/0005_lean_stranger.sql", import.meta.url), "utf8"),
    readFile(new URL("../.openai/hosting.json", import.meta.url), "utf8"),
    readFile(new URL("../app/growth/GrowthArchiveClient.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(course, /<CourseNotePanel/);
  assert.match(panel, /本关学习笔记/);
  assert.match(panel, /onPaste/);
  assert.match(panel, /accept="image\/jpeg,image\/png,image\/webp,image\/gif"/);
  assert.match(panel, /已保存到账号 · 成长档案同步更新/);
  assert.match(panel, /同步账号编号/);
  assert.match(panel, /本关云端更新时间/);
  assert.match(noteRoute, /getChatGPTUser/);
  assert.match(noteRoute, /chatGPTUserFingerprint/);
  assert.match(noteRoute, /accountFingerprint/);
  assert.match(noteRoute, /owner_id = \? AND course_id = \?/);
  assert.match(imageUpload, /noteImageBucket\(\)\.put/);
  assert.match(imageUpload, /每关最多保存/);
  assert.match(imageRead, /owner_id = \?/);
  assert.match(imageRead, /Cache-Control/);
  assert.match(schema, /courseNotes/);
  assert.match(schema, /courseNoteImages/);
  assert.match(migration, /CREATE TABLE `course_notes`/);
  assert.match(migration, /CREATE TABLE `course_note_images`/);
  assert.match(hosting, /"r2": "NOTE_IMAGES"/);
  assert.match(growth, /LEARNING NOTE DIRECTORY/);
  assert.match(growth, /按“课程 \/ 章节 \/ 关卡”归档/);
});

test("课程说明支持有权限账号在网页内编辑并恢复源码默认值", async () => {
  const [course, editor, route, content, schema, envExample] = await Promise.all([
    readFile(new URL("../app/courses/python-framework/PythonCourseClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/courses/python-framework/CourseContentEditButton.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/course-content/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/course-content.ts", import.meta.url), "utf8"),
    readFile(new URL("../db/schema.ts", import.meta.url), "utf8"),
    readFile(new URL("../.env.example", import.meta.url), "utf8"),
  ]);

  assert.match(course, /课程编辑权限已启用/);
  assert.match(course, /所有允许的查找机制都失败后必须明确报错/);
  assert.match(editor, /保存到云端/);
  assert.match(editor, /恢复源码内容/);
  assert.match(editor, /method: "POST"/);
  assert.match(editor, /action: "save"/);
  assert.match(editor, /action: "reset"/);
  assert.match(editor, /返回了网页而不是数据/);
  assert.match(route, /当前账号没有课程编辑权限/);
  assert.match(route, /export async function POST/);
  assert.match(route, /payload\.action === "save"/);
  assert.match(route, /payload\.action === "reset"/);
  assert.match(route, /ON CONFLICT\(content_key\)/);
  assert.match(content, /COURSE_CONTENT_ADMIN_EMAIL_HASHES/);
  assert.match(content, /SHA-256/);
  assert.match(schema, /courseContentOverrides/);
  assert.match(envExample, /COURSE_CONTENT_ADMIN_EMAIL_HASHES=/);
});

test("面试陪练是独立入口并且不使用课程分享图", async () => {
  const homeHtml = await (await render("/")).text();
  assert.match(homeHtml, /href=["']\/interview["']/);

  const response = await render("/interview");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>岗位面试陪练 \| 测试能力修炼场<\/title>/);
  assert.doesNotMatch(html, /og-platform\.png|og\.png/);
});

test("面试系统以数据驱动能力地图为首屏", async () => {
  const [client, api] = await Promise.all([
    readFile(new URL("../app/interview/InterviewCoachClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/interview/route.ts", import.meta.url), "utf8"),
  ]);
  assert.match(client, /useState<View>\("overview"\)/);
  assert.match(client, /data\.modules\.map/);
  assert.match(client, /refresh_sources/);
  assert.match(api, /interview_capability_modules/);
  assert.match(api, /kind !== "adaptive" \|\| Number\(module\.signalCount\) > 0/);
  assert.match(api, /openai\/openai-agents-python/);
  assert.match(client, /courseForCompetency/);
  assert.match(client, /去学「\{course\.courseTitle\}」/);
});

test("面试回答真实调用 DeepSeek，并把诊断转成成长计划", async () => {
  const [client, api, growth] = await Promise.all([
    readFile(new URL("../app/interview/InterviewCoachClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/interview/route.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/growth/GrowthArchiveClient.tsx", import.meta.url), "utf8"),
  ]);

  assert.match(client, /DeepSeek 即时诊断/);
  assert.match(client, /DeepSeek 正在阅读回答并生成成长建议/);
  assert.match(api, /getChatGPTUser/);
  assert.match(api, /requestDeepSeekJson/);
  assert.match(api, /analyzeInterviewAnswer/);
  assert.match(api, /SELECT prompt, competency, tags_json, source_ref/);
  assert.match(api, /只依据回答中实际出现的内容评分/);
  assert.match(api, /analysis\.plan/);
  assert.match(api, /durationMinutes/);
  assert.doesNotMatch(api, /function analyzeAnswer|lengthScore|hasStructure|hasEvidence/);
  assert.match(growth, /真实学习行为 \+ 笔记证据 \+ DeepSeek 诊断/);
  assert.match(growth, /诊断后的任务会进入同一份成长计划/);
});

test("技术雷达与成长档案是独立页面", async () => {
  const radar = await (await render("/radar")).text();
  assert.match(radar, /周一 09:30/);
  assert.match(radar, /首个周一 10:00/);
  assert.match(radar, /每天 19:30/);
  assert.match(radar, /本地知识库巡检/);
  assert.match(radar, /课程修改草稿/);
  assert.match(radar, /面试内容修改草稿/);
  assert.match(radar, /人工确认/);
  assert.match(radar, /新技术先进入雷达/);

  const growth = await (await render("/growth")).text();
  assert.match(growth, /GROWTH ARCHIVE/);
  assert.match(growth, /课程进度来自学习记录/);
});

test("成长平台入口统一沿用面试系统视觉语言", async () => {
  const [styles, home, learning, radar, growth] = await Promise.all([
    readFile(new URL("../app/globals.css", import.meta.url), "utf8"),
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/LearningHome.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/radar/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/growth/GrowthArchiveClient.tsx", import.meta.url), "utf8"),
  ]);

  for (const source of [home, learning, radar, growth]) assert.match(source, /suite-topbar/);
  assert.match(styles, /\.platform-rail[\s\S]*background: #f7f7f5/);
  assert.match(styles, /\.growth-dashboard[\s\S]*font-family: var\(--font-geist-sans\)/);
  assert.match(styles, /\.platform-home \.module-card[\s\S]*border-radius: 15px/);
  assert.match(styles, /\.workspace-page-hero[\s\S]*background: #fff/);
});

test("质量工程与保障补齐白盒测试和质量门禁路线", async () => {
  const [registry, roadmaps, capabilityMap] = await Promise.all([
    readFile(new URL("../app/learning-registry.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/blueprint-roadmaps.ts", import.meta.url), "utf8"),
    readFile(new URL("../app/capability-registry.ts", import.meta.url), "utf8"),
  ]);

  assert.match(registry, /id: "quality-engineering"/);
  for (const topic of ["黑盒、白盒与灰盒测试", "代码分支与白盒用例", "覆盖率与覆盖率误区", "CI/CD 质量门禁"]) {
    assert.match(roadmaps, new RegExp(topic));
  }
  assert.match(registry, /foundation\.quality_engineering/);
  assert.match(registry, /radar\.quality_devops/);
  assert.match(registry, /radar\.coverage_py/);
  assert.match(capabilityMap, /competency: "测试基础"[\s\S]*href: "\/courses\/quality-engineering"/);
  assert.match(capabilityMap, /competency: "CI\/CD"[\s\S]*href: "\/courses\/quality-engineering"/);
});

test("AI 测试课程吸收智能体质量保障实践并保留通用边界", async () => {
  const registry = await readFile(new URL("../app/learning-registry.ts", import.meta.url), "utf8");

  for (const topic of ["E0/E1/E2 风险分级", "G/T 双层指标", "主路径 core、风险 risk、回归 regression", "trace_id", "绝对阈值、基线退化和一票否决", "TTFT 与 E2EL P95"]) {
    assert.match(registry, new RegExp(topic));
  }
  assert.match(registry, /foundation\.opentelemetry/);
  assert.match(registry, /project\.agent_testing_practice/);
  assert.match(registry, /具体阈值只作模板/);
  assert.doesNotMatch(registry, /sf-alidocs\.dingtalk\.com/);
});

test("面试能力分只由真实回答证据生成", async () => {
  const [client, api] = await Promise.all([
    readFile(new URL("../app/interview/InterviewCoachClient.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/api/interview/route.ts", import.meta.url), "utf8"),
  ]);
  assert.doesNotMatch(api, /INSERT OR IGNORE INTO interview_competency_scores/);
  assert.match(api, /DELETE FROM interview_competency_scores WHERE evidence_count = 0/);
  assert.match(api, /evidenceScore !== null && evidenceScore < 60/);
  assert.match(client, /未评估/);
  assert.match(client, /item\.evidence_count/);
});

test("跨页面入口使用原生导航，避免生产环境预取崩溃", async () => {
  const files = await Promise.all([
    readFile(new URL("../app/LearningHome.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/PlatformShell.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/courses/[moduleId]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/courses/python-framework/PythonCourseClient.tsx", import.meta.url), "utf8"),
  ]);

  for (const source of files) {
    assert.doesNotMatch(source, /from ["']next\/link["']/);
  }
  assert.match(files[0], /<a[\s\S]*href=\{`\/courses\/\$\{module\.id\}`\}/);
  assert.match(files[1], /href=\{item\.href\}/);
});
