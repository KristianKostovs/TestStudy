"""A1–A6 contract scenarios using only synthetic IDs and in-memory fakes."""

from bill_contract.sample_adapter import generate_sample_bills


class FakeStatusGateway:
    def __init__(self, statuses, failed_batches=()):
        self.statuses = statuses
        self.failed_batches = set(failed_batches)
        self.calls = []

    def lookup(self, person_ids):
        self.calls.append(tuple(person_ids))
        if len(self.calls) in self.failed_batches:
            raise RuntimeError("synthetic status lookup failure")
        return {person_id: self.statuses[person_id] for person_id in person_ids if person_id in self.statuses}


class FakeBillStore:
    def __init__(self, existing=()):
        self.records = set(existing)
        self.created = []
        self.details = []

    def exists(self, period, person_id):
        return (period, person_id) in self.records

    def create(self, period, person_id):
        self.records.add((period, person_id))
        self.created.append((period, person_id))
        self.details.append((period, person_id, "synthetic-detail"))


PERIOD = "sample-period"


def test_a1_all_active_people_get_new_bills():
    gateway = FakeStatusGateway({"P001": "active", "P002": "active"})
    store = FakeBillStore()
    assert generate_sample_bills(PERIOD, ["P001", "P002"], gateway, store) == ["P001", "P002"]
    assert store.created == [(PERIOD, "P001"), (PERIOD, "P002")]
    assert [detail[1] for detail in store.details] == ["P001", "P002"]


def test_a2_inactive_person_has_no_write():
    gateway = FakeStatusGateway({"P001": "active", "P002": "inactive"})
    store = FakeBillStore()
    assert generate_sample_bills(PERIOD, ["P001", "P002"], gateway, store) == ["P001"]
    assert store.created == [(PERIOD, "P001")]
    assert [detail[1] for detail in store.details] == ["P001"]


def test_a3_missing_status_and_missing_response_have_no_write():
    gateway = FakeStatusGateway({"P001": "active", "P002": "unknown"})
    store = FakeBillStore()
    assert generate_sample_bills(PERIOD, ["P001", "P002", "P003"], gateway, store) == ["P001"]
    assert store.created == [(PERIOD, "P001")]
    assert [detail[1] for detail in store.details] == ["P001"]


def test_a4_partial_and_total_lookup_failure_fail_closed():
    people = [f"P{i:04}" for i in range(501)]
    statuses = {person_id: "active" for person_id in people}
    partial_gateway = FakeStatusGateway(statuses, failed_batches={2})
    partial_store = FakeBillStore()
    assert generate_sample_bills(PERIOD, people, partial_gateway, partial_store) == people[:500]
    assert len(partial_store.created) == 500
    assert (PERIOD, people[500]) not in partial_store.records
    assert people[500] not in [detail[1] for detail in partial_store.details]

    total_gateway = FakeStatusGateway(statuses, failed_batches={1, 2})
    total_store = FakeBillStore()
    assert generate_sample_bills(PERIOD, people, total_gateway, total_store) == []
    assert total_store.created == []
    assert total_store.details == []


def test_a5_status_queries_use_batches_of_at_most_500():
    people = [f"P{i:04}" for i in range(1001)]
    gateway = FakeStatusGateway({person_id: "active" for person_id in people})
    store = FakeBillStore()
    assert generate_sample_bills(PERIOD, people, gateway, store) == people
    assert [len(call) for call in gateway.calls] == [500, 500, 1]
    assert len(store.created) == 1001


def test_a6_existing_bill_and_duplicate_candidate_are_not_recreated():
    gateway = FakeStatusGateway({"P001": "active", "P002": "active"})
    store = FakeBillStore(existing={(PERIOD, "P001")})
    assert generate_sample_bills(PERIOD, ["P001", "P002", "P002"], gateway, store) == ["P002"]
    assert gateway.calls == [("P001", "P002")]
    assert store.created == [(PERIOD, "P002")]
    assert store.details == [(PERIOD, "P002", "synthetic-detail")]
