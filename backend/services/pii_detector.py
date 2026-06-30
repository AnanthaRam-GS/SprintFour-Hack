import os

from models import Span
from services.mock_detector import detect_mock


async def detect_llm_stub(text: str, mode: str) -> list[Span]:
    # TODO: Replace this stub with real LLM-backed PII detection once integration is ready.
    return detect_mock(text, mode)


async def detect_pii(text: str, mode: str) -> list[Span]:
    use_llm = os.getenv("USE_LLM", "").lower() == "true"

    if use_llm:
        return await detect_llm_stub(text, mode)

    return detect_mock(text, mode)
