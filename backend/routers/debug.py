import os

from fastapi import APIRouter
from pydantic import BaseModel

from config import get_allowed_origins, load_backend_env

router = APIRouter(prefix="/api/v1/debug", tags=["debug"])


class DebugConfigResponse(BaseModel):
    use_llm: bool
    llm_provider: str
    llm_base_url: str
    llm_model: str
    llm_api_key_present: bool
    allowed_origins: list[str]


@router.get("/config", response_model=DebugConfigResponse)
async def debug_config() -> DebugConfigResponse:
    # Development-only helper for hackathon diagnostics. Remove or disable before production hardening.
    load_backend_env()
    return DebugConfigResponse(
        use_llm=os.getenv("USE_LLM", "").lower() == "true",
        llm_provider=os.getenv("LLM_PROVIDER", "openai-compatible"),
        llm_base_url=os.getenv("LLM_BASE_URL", "https://api.deepseek.com"),
        llm_model=os.getenv("LLM_MODEL", "deepseek-chat"),
        llm_api_key_present=bool(os.getenv("LLM_API_KEY", "").strip()),
        allowed_origins=get_allowed_origins(),
    )
