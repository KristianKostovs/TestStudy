from contextlib import redirect_stdout
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
        self.assertEqual(output, "收尾\n")

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
            self.assertEqual(stream.getvalue(), "收尾\n")

    def test_empty_steps(self):
        report, output = self.run_capture({"initial_available": 10, "steps": []})
        self.assertEqual(report, {"available": 10, "steps": []})
        self.assertEqual(output, "收尾\n")
