import { readFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import ts from "typescript";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const source = await readFile(resolve(root, "app/courses/python-framework/building-blocks/block-data.ts"), "utf8");
const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
const { frameworkBlocks, assembledRunner, flowData } = await import("data:text/javascript;base64," + Buffer.from(code).toString("base64"));
const taskFlow = { ...flowData, steps: [...flowData.steps, { action: "stock.adjust", amount: 2, expected: 15 }] };
const files = {
  "runner.py": assembledRunner,
  "flow.json": JSON.stringify(flowData, null, 2),
  "examples/flow.json": JSON.stringify(flowData, null, 2),
  "exercises/flow.json": JSON.stringify(taskFlow, null, 2),
  "solutions/flow.json": JSON.stringify(taskFlow, null, 2),
  "metadata.json": JSON.stringify(frameworkBlocks.map((block) => ({ id: block.id, file: block.file, output: block.taskOutput, error: block.errorExpected ?? null })), null, 2),
  "README.md": `# 从底层积木拼出框架

Python 3.10 或更高版本，无第三方依赖，不访问真实接口或数据库。

## 一块一块运行

先运行 python3 examples/01_values.py，按编号逐个运行 examples 中的八个文件。每份例子完整可运行，使用同一个库存主题。最后运行 python3 runner.py，从旁边的 flow.json 读取两步流程。

## 自己修改

exercises 是尚未完成的练习。每次只完成一项，再运行 python3 verify.py --block 1（把数字换成当前积木编号）。

验证器会运行 exercises 中对应文件，检查退出状态和输出。第 7 项故意触发 AssertionError，只有确认该异常与“收尾”输出才算通过。不要用 python -O 运行本练习，优化模式会跳过 assert。

solutions 提供参考修改，仅在自己完成后查看。python3 verify.py --block 1 --reference 只检查参考实现。

网页草稿不会自动写到本目录，验证结果也不会自动回传网页。先在 exercises 文件里保存自己的代码，再执行验证。

## 验证小框架

python3 -m unittest discover -s tests -v 检查 Runner 的正常链路、两次运行隔离、错误动作、错误预期、库存不足和失败时收尾。

这个小框架只演示普通函数如何组合。finally 中打印“收尾”不等于完成真实清理；没有验证数据库回滚、HTTP、并发或生产系统。输入结构校验、持久化和真实资源释放是后续主题。
`,
  "verify.py": `import argparse
import json
from pathlib import Path
import subprocess
import sys

parser = argparse.ArgumentParser()
parser.add_argument("--block", type=int, required=True, choices=range(1, 9))
parser.add_argument("--reference", action="store_true")
args = parser.parse_args()
root = Path(__file__).resolve().parent
item = next(row for row in json.loads((root / "metadata.json").read_text(encoding="utf-8")) if row["id"] == args.block)
folder = root / ("solutions" if args.reference else "exercises")
result = subprocess.run([sys.executable, str(folder / item["file"])], capture_output=True, text=True, timeout=10, cwd=folder)
output_ok = result.stdout.strip() == item["output"].strip()
exit_ok = (result.returncode != 0 and item["error"] in result.stderr) if item["error"] else result.returncode == 0
print("REFERENCE ONLY" if args.reference else "LEARNER IMPLEMENTATION")
if output_ok and exit_ok:
    print("PASS", args.block)
else:
    print("FAIL", args.block)
    print("expected stdout:", repr(item["output"]))
    print("actual stdout:", repr(result.stdout))
    print("exit code:", result.returncode)
    print(result.stderr)
sys.exit(0 if output_ok and exit_ok else 1)
`,
  "tests/test_runner.py": `from contextlib import redirect_stdout
from copy import deepcopy
from io import StringIO
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from runner import run_flow


class RunnerTests(unittest.TestCase):
    def setUp(self):
        self.flow = {"initial_available": 10, "steps": [
            {"action": "stock.adjust", "amount": -2, "expected": 8},
            {"action": "stock.adjust", "amount": 5, "expected": 13},
        ]}

    def run_capture(self, flow):
        stream = StringIO()
        with redirect_stdout(stream):
            report = run_flow(flow)
        return report, stream.getvalue()

    def test_chain_and_evidence(self):
        before = deepcopy(self.flow)
        report, output = self.run_capture(self.flow)
        self.assertEqual(report, {"available": 13, "steps": [{"before": 10, "after": 8}, {"before": 8, "after": 13}]})
        self.assertEqual(self.flow, before)
        self.assertEqual(output, "收尾\\n")

    def test_fresh_context_and_evidence(self):
        first, _ = self.run_capture(self.flow)
        first["steps"].append({"before": 0, "after": 999})
        second, _ = self.run_capture(self.flow)
        self.assertEqual(second["available"], 13)
        self.assertEqual(len(second["steps"]), 2)

    def test_failure_still_finishes(self):
        for step, error in [
            ({"action": "unknown", "amount": 1, "expected": 11}, KeyError),
            ({"action": "stock.adjust", "amount": -20, "expected": -10}, ValueError),
            ({"action": "stock.adjust", "amount": -2, "expected": 999}, AssertionError),
        ]:
            stream = StringIO()
            with self.subTest(step=step), redirect_stdout(stream), self.assertRaises(error):
                run_flow({"initial_available": 10, "steps": [step]})
            self.assertEqual(stream.getvalue(), "收尾\\n")

    def test_empty_steps(self):
        report, output = self.run_capture({"initial_available": 10, "steps": []})
        self.assertEqual(report, {"available": 10, "steps": []})
        self.assertEqual(output, "收尾\\n")
`,
};

for (const block of frameworkBlocks) {
  files["examples/" + block.file] = block.code;
  files["exercises/" + block.file] = block.starter;
  files["solutions/" + block.file] = block.solution;
}
const target = resolve(root, "public/downloads/python-framework-blocks.zip");
await mkdir(dirname(target), { recursive: true });
const packer = `import json,sys
from zipfile import ZipFile,ZipInfo,ZIP_DEFLATED
from pathlib import PurePosixPath
files=json.load(sys.stdin)
with ZipFile(sys.argv[1],"w",compression=ZIP_DEFLATED) as archive:
    for name,content in sorted(files.items()):
        assert not name.startswith("/") and ".." not in PurePosixPath(name).parts
        item=ZipInfo("python-framework-blocks/"+name,date_time=(2026,11,6,0,0,0))
        item.compress_type=ZIP_DEFLATED
        archive.writestr(item,content.encode("utf-8"))
`;
const result = spawnSync("python3", ["-c", packer, target], { input: JSON.stringify(files), encoding: "utf8" });
if (result.status !== 0) throw new Error(result.stderr);
console.log(target);
