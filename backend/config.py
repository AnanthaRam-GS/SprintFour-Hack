import os
from pathlib import Path

from dotenv import load_dotenv

_ENV_LOADED = False


def load_backend_env() -> None:
    global _ENV_LOADED
    if _ENV_LOADED:
        return

    backend_dir = Path(__file__).resolve().parent
    env_path = backend_dir / ".env"
    load_dotenv(dotenv_path=env_path, override=False)
    load_dotenv(override=False)
    _ENV_LOADED = True


def get_allowed_origins() -> list[str]:
    load_backend_env()
    raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
    origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
    return origins or ["http://localhost:3000"]


def mask_api_key(value: str) -> str:
    if not value:
        return "missing"
    if len(value) <= 6:
        return f"{value[:1]}***"
    return f"{value[:3]}***{value[-3:]}"
