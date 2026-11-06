import argparse
from pathlib import Path
import sys
import unittest

parser = argparse.ArgumentParser(description="运行质量工程练习的客观测试")
parser.add_argument("--reference", action="store_true", help="仅校验参考实现")
parser.add_argument("--task", choices=["summary", "inventory", "classification", "gate", "metrics"])
args = parser.parse_args()
root = Path(__file__).resolve().parent
sys.path.insert(0, str(root / ("solutions" if args.reference else "src")))
loader = unittest.TestLoader()
suite = loader.discover(str(root / "tests"))
if args.task:
    def matching(suite):
        result = unittest.TestSuite()
        for item in suite:
            if isinstance(item, unittest.TestSuite):
                result.addTests(matching(item))
            elif args.task in item.id().lower():
                result.addTest(item)
        return result
    suite = matching(suite)
if not suite.countTestCases():
    parser.error("没有匹配的测试")
print("REFERENCE ONLY" if args.reference else "LEARNER IMPLEMENTATION", flush=True)
result = unittest.TextTestRunner(verbosity=2).run(suite)
sys.exit(0 if result.wasSuccessful() else 1)
