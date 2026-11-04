"""Independently written sample implementation; never calls a business system."""

from typing import Iterable, List, Protocol, Sequence, Mapping


class StatusGateway(Protocol):
    def lookup(self, person_ids: Sequence[str]) -> Mapping[str, str]:
        """Return synthetic status values keyed by person ID."""


class BillStore(Protocol):
    def exists(self, period: str, person_id: str) -> bool:
        """Whether this period already has a bill for the person."""

    def create(self, period: str, person_id: str) -> None:
        """Create one bill and its detail in the fake store."""


def generate_sample_bills(
    period: str,
    candidate_ids: Iterable[str],
    gateway: StatusGateway,
    store: BillStore,
) -> List[str]:
    """Apply the public contract to fake dependencies and return created IDs."""
    unique_ids = list(dict.fromkeys(candidate_ids))
    created = []
    for offset in range(0, len(unique_ids), 500):
        batch = unique_ids[offset : offset + 500]
        try:
            statuses = gateway.lookup(batch)
        except Exception:
            # An uncertain batch cannot authorize a new bill.
            continue
        for person_id in batch:
            if statuses.get(person_id) != "active":
                continue
            if store.exists(period, person_id):
                continue
            store.create(period, person_id)
            created.append(person_id)
    return created
