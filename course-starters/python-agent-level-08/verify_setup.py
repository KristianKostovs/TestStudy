import importlib.metadata
import os
from pathlib import Path
import subprocess
import sys
import tempfile


ROOT = Path(__file__).parent.resolve()
EXPECTED_VERSIONS = {
    "httpx": "0.28.1",
    "pydantic": "2.11.7",
    "python-dotenv": "1.1.1",
}


def verify_dependencies() -> None:
    for package, expected in EXPECTED_VERSIONS.items():
        actual = importlib.metadata.version(package)
        assert actual == expected, f"{package} 版本应为 {expected}，实际为 {actual}"


def verify_gitignore() -> None:
    rules = (ROOT / ".gitignore").read_text(encoding="utf-8").splitlines()
    for expected in (".venv/", ".env", "__pycache__/", "*.pyc"):
        assert expected in rules, f".gitignore 缺少 {expected}"


def import_settings(environment: dict[str, str], cwd: str) -> subprocess.CompletedProcess[str]:
    return subprocess.run(
        [sys.executable, "-c", "import ticket_assistant.settings"],
        cwd=cwd,
        env=environment,
        text=True,
        capture_output=True,
        check=False,
    )


def verify_settings() -> None:
    success_environment = os.environ.copy()
    success_environment["PYTHONPATH"] = str(ROOT)
    success_environment["TICKET_API_KEY"] = "course-demo-only"
    success = import_settings(success_environment, str(ROOT))
    assert success.returncode == 0, success.stderr

    missing_environment = os.environ.copy()
    missing_environment["PYTHONPATH"] = str(ROOT)
    missing_environment.pop("TICKET_API_KEY", None)
    with tempfile.TemporaryDirectory() as empty_directory:
        missing = import_settings(missing_environment, empty_directory)
    assert missing.returncode != 0, "缺少 TICKET_API_KEY 时应该启动失败"
    assert "TICKET_API_KEY" in missing.stderr, "失败信息应该指出缺少 TICKET_API_KEY"


verify_dependencies()
verify_gitignore()
verify_settings()
print("第 8 关环境验证通过")
