from dataclasses import dataclass

from .client import TicketClient


@dataclass(frozen=True)
class Ticket:
    id: str
    status: str
    title: str


class TicketService:
    def __init__(self, client: TicketClient):
        self.client = client

    def get(self, ticket_id: str) -> Ticket:
        return Ticket(**self.client.get_ticket(ticket_id))
