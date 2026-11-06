from copy import deepcopy
import unittest
from lab import Inventory, classify_failure, classification_metrics, release_gate, summarize_failures


class SummaryTests(unittest.TestCase):
    def test_group_and_preserve_input(self):
        rows = [{"success": False, "error_code": "E1"}, {"success": True},
                {"success": False, "error_code": "E1"}, {"success": False, "error_code": "E2"}]
        before = deepcopy(rows)
        self.assertEqual(summarize_failures(rows), {"E1": 2, "E2": 1})
        self.assertEqual(rows, before)

    def test_empty(self):
        self.assertEqual(summarize_failures([]), {})

    def test_invalid(self):
        for row in [{"success": False}, {"success": "false"}, {"success": False, "error_code": " "}]:
            with self.subTest(row=row), self.assertRaises(ValueError):
                summarize_failures([row])


class InventoryTests(unittest.TestCase):
    def test_duplicate_and_conflict(self):
        stock = Inventory(10)
        self.assertEqual(stock.apply("E1", -2), 8)
        self.assertEqual(stock.apply("E2", -1), 7)
        self.assertEqual(stock.apply("E1", -2), 8)
        self.assertEqual(stock.available, 7)
        with self.assertRaises(ValueError):
            stock.apply("E1", -3)
        self.assertEqual(stock.available, 7)
        self.assertEqual(len(stock.events), 2)

    def test_failure_is_atomic_and_retryable(self):
        stock = Inventory(1)
        with self.assertRaises(ValueError):
            stock.apply("E1", -2)
        self.assertEqual(stock.available, 1)
        self.assertNotIn("E1", stock.events)
        stock.apply("ADD", 2)
        self.assertEqual(stock.apply("E1", -2), 1)

    def test_invalid_initial_value(self):
        for value in [-1, True, "10"]:
            with self.subTest(value=value), self.assertRaises(ValueError):
                Inventory(value)

    def test_invalid_event(self):
        for event, amount in [("", 1), (" ", 1), ("E1", 0), ("E1", True), ("E1", "1")]:
            stock = Inventory(10)
            with self.subTest(event=event, amount=amount), self.assertRaises(ValueError):
                stock.apply(event, amount)
            self.assertEqual(stock.available, 10)
            self.assertEqual(stock.events, {})


class ClassificationTests(unittest.TestCase):
    def test_layers(self):
        cases = [
            ({"transport_error": "timeout", "http_status": 200}, "transport"),
            ({"http_status": 401}, "auth"), ({"http_status": 403}, "auth"),
            ({"http_status": 503}, "http"), ({"http_status": 302}, "http"),
            ({"http_status": 200, "business_success": False}, "business"),
            ({"http_status": 201, "business_success": True}, "ok"),
            ({}, "unknown"), ({"http_status": 200}, "unknown"),
        ]
        for arguments, expected in cases:
            with self.subTest(arguments=arguments):
                self.assertEqual(classify_failure(**arguments), expected)


class GateTests(unittest.TestCase):
    def test_decisions(self):
        self.assertEqual(release_gate(1, True), "block")
        self.assertEqual(release_gate(1, False), "block")
        self.assertEqual(release_gate(0, False), "review")
        self.assertEqual(release_gate(0, True), "pass")

    def test_invalid(self):
        for count, complete in [(-1, True), (True, True), (0, "yes")]:
            with self.subTest(count=count, complete=complete), self.assertRaises(ValueError):
                release_gate(count, complete)


class MetricsTests(unittest.TestCase):
    def test_confusion(self):
        result = classification_metrics(["business", "business", "env", "env"],
                                        ["business", "env", "business", "env"])
        self.assertEqual(result, {"tp": 1, "fp": 1, "fn": 1, "precision": .5, "recall": .5})

    def test_zero_denominators(self):
        self.assertEqual(classification_metrics([], []),
                         {"tp": 0, "fp": 0, "fn": 0, "precision": None, "recall": None})
        result = classification_metrics(["business"], ["env"])
        self.assertIsNone(result["precision"])
        self.assertEqual(result["recall"], 0)

    def test_invalid_lengths(self):
        with self.assertRaises(ValueError):
            classification_metrics(["business"], [])
