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

test("首页只负责选择学习方向", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();

  assert.match(html, /<title>测试能力修炼场<\/title>/);
  assert.match(html, /先选方向/);
  for (const moduleId of [
    "python-framework",
    "ui-automation",
    "api-automation",
    "ai-testing",
    "performance-testing",
  ]) {
    assert.match(html, new RegExp(`href=["']/courses/${moduleId}["']`));
  }
  assert.doesNotMatch(html, /id=["']level-1["']/);
});

test("各方向拥有可独立访问的课程页面", async () => {
  const cases = [
    ["/courses/python-framework", "Python 框架基础十关"],
    ["/courses/ui-automation", "UI 自动化十关路线"],
    ["/courses/api-automation", "API 自动化十关路线"],
    ["/courses/ai-testing", "AI 测试十关路线"],
    ["/courses/performance-testing", "性能测试十关路线"],
  ];

  for (const [pathname, expectedTitle] of cases) {
    const response = await render(pathname);
    assert.equal(response.status, 200, pathname);
    const html = await response.text();
    assert.match(html, new RegExp(`<title>${expectedTitle} \\| 测试能力修炼场<\\/title>`), pathname);
    assert.match(html, /href=["']\/["']/, pathname);
  }
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

test("Python 关卡同时支持本机 Codex 对话与异步备用队列", async () => {
  const source = await readFile(new URL("../app/courses/python-framework/PythonCourseClient.tsx", import.meta.url), "utf8");
  const route = await readFile(new URL("../app/api/course-grade/route.ts", import.meta.url), "utf8");
  const queue = await readFile(new URL("../app/grading-queue/GradingQueueClient.tsx", import.meta.url), "utf8");
  const bridge = await readFile(new URL("../local-companion/server.mjs", import.meta.url), "utf8");
  const launcher = await readFile(new URL("../启动本地Codex学习站.command", import.meta.url), "utf8");

  assert.match(source, /const learningStages = \["先认词", "看数据", "逐行理解", "动手练", "自动小测"\]/);
  assert.match(source, /<textarea/);
  assert.match(source, /event\.key === "Tab"/);
  assert.match(source, /event\.key === "Enter"/);
  assert.match(source, /wrap="soft"/);
  assert.match(source, /fetch\("\/api\/course-grade"/);
  assert.match(source, /action: "enqueue"/);
  assert.match(source, /待评判/);
  assert.match(source, /评判中/);
  assert.match(source, /已完成/);
  assert.match(route, /const gradingMode = "codex_queue"/);
  assert.match(route, /course_grading_submissions/);
  assert.match(route, /action === "claim"/);
  assert.match(route, /action === "complete"/);
  assert.doesNotMatch(route, /api\.openai\.com/);
  assert.match(queue, /领取并复制 Codex 批改单/);
  assert.match(queue, /保存批改结果并标记完成/);
  assert.match(source, /localCodexBridge/);
  assert.match(source, /本机 Codex 已连接/);
  assert.match(source, /立即批改当前答案/);
  assert.match(source, /继续和 Codex 对话/);
  assert.match(bridge, /"exec"/);
  assert.match(bridge, /"--ephemeral"/);
  assert.match(bridge, /model_reasoning_effort/);
  assert.match(bridge, /"--sandbox", "read-only"/);
  assert.match(bridge, /Logged in/);
  assert.match(launcher, /node local-companion\/server\.mjs/);

  const response = await render("/grading-queue");
  assert.equal(response.status, 200);
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
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/courses/[moduleId]/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/courses/python-framework/PythonCourseClient.tsx", import.meta.url), "utf8"),
  ]);

  for (const source of files) {
    assert.doesNotMatch(source, /from ["']next\/link["']/);
  }
  assert.match(files[0], /<a[\s\S]*href=\{`\/courses\/\$\{module\.id\}`\}/);
});
