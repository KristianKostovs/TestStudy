import assert from "node:assert/strict";
import { readFile, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";
import ts from "typescript";

const source = await readFile(new URL("../app/courses/python-framework/building-blocks/block-data.ts", import.meta.url), "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { frameworkBlocks, flowData } = await import("data:text/javascript;base64," + Buffer.from(code).toString("base64"));

test("八块积木的完整例子均可运行，输出与讲解一致", async () => {
  const directory = await mkdtemp(join(tmpdir(), "framework-blocks-"));
  try {
    await writeFile(join(directory, "flow.json"), JSON.stringify(flowData));
    for (const block of frameworkBlocks) {
      assert.ok(block.code.includes(block.added[0]));
      if (block.id !== 8) {
        const result = spawnSync("python3", ["-c", block.code], { encoding: "utf8" });
        assert.equal(result.status, 0, block.title + result.stderr);
        assert.equal(result.stdout.trim(), block.output.trim(), block.title);
      } else {
        await writeFile(join(directory, "runner.py"), block.code);
        const run = spawnSync("python3", [join(directory, "runner.py")], { encoding: "utf8" });
        assert.equal(run.status, 0, run.stderr);
        assert.equal(run.stdout.trim(), block.output.trim());
      }
    }
  } finally { await rm(directory, { recursive: true, force: true }); }
});

test("下载包内的参考修改、待完成任务与 Runner 失败行为分别验证", async () => {
  const directory = await mkdtemp(join(tmpdir(), "framework-blocks-zip-"));
  const archive = new URL("../public/downloads/python-framework-blocks.zip", import.meta.url);
  try {
    const extract = spawnSync("python3", ["-m", "zipfile", "-e", fileURLToPath(archive), directory], { encoding: "utf8" });
    assert.equal(extract.status, 0, extract.stderr);
    const cwd = join(directory, "python-framework-blocks");
    for (const block of frameworkBlocks) {
      const reference = spawnSync("python3", ["verify.py", "--block", String(block.id), "--reference"], { cwd, encoding: "utf8" });
      assert.equal(reference.status, 0, block.title + reference.stdout + reference.stderr);
      const learner = spawnSync("python3", ["verify.py", "--block", String(block.id)], { cwd, encoding: "utf8" });
      assert.equal(learner.status, 1, block.title);
    }
    const runner = spawnSync("python3", ["-m", "unittest", "discover", "-s", "tests", "-v"], { cwd, encoding: "utf8" });
    assert.equal(runner.status, 0, runner.stderr);
  } finally { await rm(directory, { recursive: true, force: true }); }
});
