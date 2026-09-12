import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path.cwd() / ".env")

# TODO：URL 可选且有本地默认值；API_KEY 必填。
TICKET_API_URL = ...
TICKET_API_KEY = ...
