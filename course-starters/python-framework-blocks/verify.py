import argparse
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
