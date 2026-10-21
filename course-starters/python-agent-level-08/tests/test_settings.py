import pytest

from ticket_assistant.settings import load_settings


def test_uses_local_default_url(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("TICKET_API_URL", raising=False)
    monkeypatch.setenv("TICKET_API_KEY", "test-only")

    settings = load_settings()

    assert settings.api_url == "http://127.0.0.1:8000"
    assert settings.api_key == "test-only"


def test_reads_explicit_url(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("TICKET_API_URL", "https://tickets.example.test")
    monkeypatch.setenv("TICKET_API_KEY", "test-only")

    assert load_settings().api_url == "https://tickets.example.test"


def test_missing_api_key_fails_immediately(monkeypatch: pytest.MonkeyPatch, tmp_path) -> None:
    monkeypatch.chdir(tmp_path)
    monkeypatch.delenv("TICKET_API_KEY", raising=False)

    with pytest.raises(KeyError, match="TICKET_API_KEY"):
        load_settings()
