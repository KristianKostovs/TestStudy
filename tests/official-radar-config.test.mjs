import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const configUrl = new URL("../config/official-radar-sources.json", import.meta.url);

test("官方雷达来源可以同时映射到课程和面试能力", async () => {
  const config = JSON.parse(await readFile(configUrl, "utf8"));
  assert.equal(config.version, 1);
  assert.equal(config.timezone, "Asia/Shanghai");
  assert.equal(config.weeklySchedule, "每周一 09:30");
  assert.equal(config.monthlySchedule, "每月第一个周一 10:00");
  assert.ok(config.sources.length >= 10);

  const ids = new Set();
  for (const source of config.sources) {
    assert.ok(source.id && !ids.has(source.id), `来源 ID 应唯一: ${source.id}`);
    ids.add(source.id);
    assert.match(source.url, /^https:\/\//);
    assert.ok(source.authority);
    assert.ok(source.scope);
    assert.ok(Array.isArray(source.courseModules) && source.courseModules.length > 0);
    assert.ok(Array.isArray(source.interviewCompetencies) && source.interviewCompetencies.length > 0);
  }

  for (const source of config.interviewSignals) {
    assert.ok(source.urls.every((url) => /^https:\/\//.test(url)));
    assert.ok(source.interviewCompetencies.length > 0);
    assert.match(source.rule, /不能|不得|只/);
  }
});
