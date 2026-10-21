from typing import Any

import httpx

from .settings import Settings


class TicketClient:
    def __init__(self, settings: Settings, client: httpx.Client):
        self.settings = settings
        self.client = client

    def get_ticket(self, ticket_id: str) -> dict[str, Any]:
        response = self.client.get(
            f"{self.settings.api_url}/tickets/{ticket_id}",
            headers={"Authorization": f"Bearer {self.settings.api_key}"},
        )
        response.raise_for_status()
        payload = response.json()
        if not payload.get("success"):
            raise LookupError(payload.get("message", "查询工单失败"))
        return payload["data"]
