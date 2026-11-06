def summarize_failures(records):
    result = {}
    for row in records:
        if not isinstance(row, dict) or type(row.get("success")) is not bool:
            raise ValueError("success must be boolean")
        if row["success"]:
            continue
        code = row.get("error_code")
        if not isinstance(code, str) or not code.strip():
            raise ValueError("failed record requires error_code")
        result[code] = result.get(code, 0) + 1
    return result


class Inventory:
    def __init__(self, available):
        if type(available) is not int or available < 0:
            raise ValueError("available must be a non-negative integer")
        self.available = available
        self.events = {}

    def apply(self, event_id, amount):
        if not isinstance(event_id, str) or not event_id.strip():
            raise ValueError("event_id is required")
        if type(amount) is not int or amount == 0:
            raise ValueError("amount must be a non-zero integer")
        if event_id in self.events:
            old_amount, result = self.events[event_id]
            if old_amount != amount:
                raise ValueError("same event_id with different payload")
            return result
        result = self.available + amount
        if result < 0:
            raise ValueError("insufficient inventory")
        self.available = result
        self.events[event_id] = (amount, result)
        return result


def classify_failure(http_status=None, business_success=None, transport_error=None):
    if transport_error:
        return "transport"
    if http_status is None:
        return "unknown"
    if http_status in (401, 403):
        return "auth"
    if not 200 <= http_status < 300:
        return "http"
    if business_success is False:
        return "business"
    if business_success is True:
        return "ok"
    return "unknown"


def release_gate(critical_failures, evidence_complete):
    if type(critical_failures) is not int or critical_failures < 0:
        raise ValueError("critical_failures must be a non-negative integer")
    if type(evidence_complete) is not bool:
        raise ValueError("evidence_complete must be boolean")
    if critical_failures:
        return "block"
    return "pass" if evidence_complete else "review"


def classification_metrics(actual, predicted, positive="business"):
    if len(actual) != len(predicted):
        raise ValueError("label counts must match")
    tp = sum(a == positive and p == positive for a, p in zip(actual, predicted))
    fp = sum(a != positive and p == positive for a, p in zip(actual, predicted))
    fn = sum(a == positive and p != positive for a, p in zip(actual, predicted))
    return {
        "tp": tp, "fp": fp, "fn": fn,
        "precision": tp / (tp + fp) if tp + fp else None,
        "recall": tp / (tp + fn) if tp + fn else None,
    }
