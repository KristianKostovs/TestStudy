def summarize_failures(records):
    raise NotImplementedError("TODO summary")


class Inventory:
    def __init__(self, available):
        self.available = available
        self.events = {}

    def apply(self, event_id, amount):
        raise NotImplementedError("TODO inventory")


def classify_failure(http_status=None, business_success=None, transport_error=None):
    raise NotImplementedError("TODO classification")


def release_gate(critical_failures, evidence_complete):
    raise NotImplementedError("TODO gate")


def classification_metrics(actual, predicted, positive="business"):
    raise NotImplementedError("TODO metrics")
