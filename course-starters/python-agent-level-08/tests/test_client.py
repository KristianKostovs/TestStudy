import json

import httpx

from ticket_assistant.client import TicketClient
from ticket_assistant.service import TicketService
from ticket_assistant.settings import Settings


def test_queries_ticket_without_real_network() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        assert request.method == "GET"
        assert request.url.path == "/tickets/T-101"
        assert request.headers["Authorization"] == "Bearer test-only"
        return httpx.Response(
            200,
            content=json.dumps({
                "success": True,
                "data": {"id": "T-101", "status": "open", "title": "无法登录"},
            }).encode(),
            headers={"Content-Type": "application/json"},
        )

    transport = httpx.MockTransport(handler)
    settings = Settings(api_url="https://tickets.example.test", api_key="test-only")
    with httpx.Client(transport=transport) as http_client:
        ticket = TicketService(TicketClient(settings, http_client)).get("T-101")

    assert ticket.id == "T-101"
    assert ticket.status == "open"
