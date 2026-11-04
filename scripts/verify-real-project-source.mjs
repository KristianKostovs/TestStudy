import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const bindingFile = new URL("../.local/real-project-sources.json", import.meta.url);

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

let bindings;
try {
  bindings = JSON.parse(readFileSync(bindingFile, "utf8"));
} catch {
  fail("本机来源映射不存在或格式无效；请先配置 .local/real-project-sources.json");
}

if (Array.isArray(bindings?.sources) && bindings.sources.length > 0) {
  for (const source of bindings.sources) {
    if (!source.id || !source.requirementPath || !source.requirementSha256 || !source.repositoryPath || !source.revision || !source.filePath || !source.sha256) {
      fail("来源映射缺少必填字段");
      continue;
    }
    try {
      const requirementHash = createHash("sha256").update(readFileSync(source.requirementPath)).digest("hex");
      if (requirementHash !== source.requirementSha256) throw new Error("requirement checksum differs");
      const type = execFileSync("git", ["-C", source.repositoryPath, "cat-file", "-t", source.revision], { encoding: "utf8" }).trim();
      if (type !== "commit") throw new Error("revision is not a commit");
      const content = execFileSync("git", ["-C", source.repositoryPath, "show", `${source.revision}:${source.filePath}`], { maxBuffer: 5 * 1024 * 1024 });
      const actual = createHash("sha256").update(content).digest("hex");
      if (actual !== source.sha256) throw new Error("checksum differs");
      console.log(`PASS: ${source.id} 的固定需求和源码与本机映射一致`);
    } catch {
      fail(`${source.id} 的固定需求或源码未能通过版本与摘要校验`);
    }
  }
} else if (bindings !== undefined) {
  fail("来源映射缺少非空的 sources 数组");
}
