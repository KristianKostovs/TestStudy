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
