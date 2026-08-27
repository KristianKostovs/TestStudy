import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { acknowledgePending, scanKnowledgeSources } from "../scripts/scan-learning-sources.mjs";

test("知识源巡检建立基线、保留待评审变化并在确认后推进基线", async () => {
  const root = await fs.mkdtemp(join(tmpdir(), "teststudy-knowledge-watch-"));
  const source = join(root, "EWMS");
  const output = join(root, "output");
  const configPath = join(root, "config.json");
  await fs.mkdir(source, { recursive: true });
  await fs.writeFile(join(source, "API.md"), "initial\n");
  await fs.writeFile(configPath, JSON.stringify({
    version: 1,
    root,
    outputDirectory: output,
    maxFileBytes: 1024,
    extensions: [".md", ".py"],
    sources: [{ id: "project.api_automation", title: "API", paths: ["EWMS"] }],
  }));

  const baseline = await scanKnowledgeSources({ configPath, now: "2026-08-27T10:00:00.000Z" });
  assert.equal(baseline.baselineCreated, true);
  assert.equal(baseline.changed, false);
  assert.equal(baseline.totalFiles, 1);

  await fs.writeFile(join(source, "API.md"), "updated\n");
  await fs.writeFile(join(source, "adapter.py"), "def run():\n    return True\n");
  const changed = await scanKnowledgeSources({ configPath, now: "2026-08-28T10:00:00.000Z" });
  assert.equal(changed.changed, true);
  assert.equal(changed.changes.modified.length, 1);
  assert.equal(changed.changes.added.length, 1);
  await fs.access(changed.pendingPath);

  const repeated = await scanKnowledgeSources({ configPath, now: "2026-08-29T10:00:00.000Z" });
  assert.equal(repeated.changed, true, "未确认的变化必须在下次巡检继续出现");

  await acknowledgePending({ configPath, now: "2026-08-29T10:01:00.000Z" });
  const settled = await scanKnowledgeSources({ configPath, now: "2026-08-30T10:00:00.000Z" });
  assert.equal(settled.changed, false);

  await fs.rm(join(source, "adapter.py"));
  const deleted = await scanKnowledgeSources({ configPath, now: "2026-08-31T10:00:00.000Z" });
  assert.equal(deleted.changes.deleted.length, 1);
});

test("根目录下新增的一级项目会被自动识别为独立知识源", async () => {
  const root = await fs.mkdtemp(join(tmpdir(), "teststudy-project-discovery-"));
  const output = join(root, "output");
  const configPath = join(root, "config.json");
  await fs.mkdir(join(root, "EWMS"));
  await fs.mkdir(join(root, "MOM"));
  await fs.writeFile(join(root, "EWMS", "README.md"), "ewms\n");
  await fs.writeFile(join(root, "MOM", "README.md"), "mom\n");
  await fs.writeFile(configPath, JSON.stringify({
    version: 1,
    root,
    discoverTopLevelProjects: true,
    outputDirectory: output,
    extensions: [".md"],
    sources: [],
  }));

  const result = await scanKnowledgeSources({ configPath, now: "2026-08-27T10:00:00.000Z" });
  assert.equal(result.totalFiles, 2);
  assert.deepEqual(Object.values(result.sourceTitles).sort(), ["EWMS", "MOM"]);
  assert.equal(Object.keys(result.filesBySource).length, 2);
});
