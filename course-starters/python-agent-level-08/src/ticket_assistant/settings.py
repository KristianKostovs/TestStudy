from dataclasses import dataclass
import os
from pathlib import Path

from dotenv import load_dotenv


@dataclass(frozen=True)
class Settings:
    api_url: str
    api_key: str


def load_settings() -> Settings:
    load_dotenv(Path.cwd() / ".env")
    # TODO：URL 是可选配置，缺失时使用本地默认值。
    api_url = ...
    # TODO：API Key 是必需配置，缺失时立即抛出 KeyError。
    api_key = ...
    return Settings(api_url=api_url, api_key=api_key)
