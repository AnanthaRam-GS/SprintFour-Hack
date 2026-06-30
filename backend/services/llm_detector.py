import json
import os
from typing import Any, Optional
from uuid import uuid4

import httpx

from config import load_backend_env
from models import Span, SpanType

SYSTEM_PROMPT = "You are a strict PII detection engine. Return only valid JSON."


def _build_prompt(text: str, mode: str) -> str:
    return f"""Analyze the following document for personally identifiable information.

Mode: {mode}

Return ONLY a JSON array with no markdown, no prose, and no explanation outside the array:
[
  {{
    "start": 0,
    "end": 0,
    "text": "exact matched text",
    "type": "NAME|EMAIL|PHONE|SSN|ADDRESS|DATE_OF_BIRTH|ID_NUMBER|CREDIT_CARD|OTHER",
    "confidence": 0.0,
    "explanation": "short explanation",
    "pattern_matched": "short pattern"
  }}
]

If no PII is found, return [].

Document:
{text}
"""


def _completion_url(base_url: str) -> str:
    trimmed = base_url.rstrip("/")
    if trimmed.endswith("/v1"):
        return f"{trimmed}/chat/completions"
    return f"{trimmed}/v1/chat/completions"


def _strip_json_fences(content: str) -> str:
    cleaned = content.strip()
    if cleaned.startswith("```"):
        lines = cleaned.splitlines()
        if lines:
            lines = lines[1:]
        if lines and lines[-1].strip() == "```":
            lines = lines[:-1]
        cleaned = "\n".join(lines).strip()
    return cleaned


def _coerce_span_type(raw_type: Any) -> SpanType:
    if isinstance(raw_type, str):
        normalized = raw_type.strip().upper()
        try:
            return SpanType(normalized)
        except ValueError:
            return SpanType.OTHER
    return SpanType.OTHER


def _coerce_int(value: Any) -> Optional[int]:
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return value
    if isinstance(value, float) and value.is_integer():
        return int(value)
    return None


def _coerce_confidence(value: Any) -> float:
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return max(0.0, min(1.0, float(value)))
    return 0.0


def _repair_offsets(
    text: str,
    start: Optional[int],
    end: Optional[int],
    span_text: str,
) -> Optional[tuple[int, int]]:
    text_length = len(text)
    if start is not None and end is not None and 0 <= start < end <= text_length:
        if text[start:end] == span_text:
            return start, end

    if not span_text:
        return None

    repaired_start = text.find(span_text)
    if repaired_start == -1:
        return None
    return repaired_start, repaired_start + len(span_text)


def _parse_spans(text: str, payload: Any) -> list[Span]:
    if not isinstance(payload, list):
        return []

    spans: list[Span] = []
    for item in payload:
        if not isinstance(item, dict):
            continue

        span_text = item.get("text")
        if not isinstance(span_text, str):
            continue

        repaired = _repair_offsets(
            text=text,
            start=_coerce_int(item.get("start")),
            end=_coerce_int(item.get("end")),
            span_text=span_text,
        )
        if repaired is None:
            continue

        start, end = repaired
        try:
            spans.append(
                Span(
                    id=str(uuid4()),
                    start=start,
                    end=end,
                    text=text[start:end],
                    type=_coerce_span_type(item.get("type")),
                    confidence=_coerce_confidence(item.get("confidence")),
                    explanation=str(item.get("explanation") or "LLM-detected possible PII."),
                    pattern_matched=str(item.get("pattern_matched") or "LLM structured detection."),
                    is_suggested=True,
                    potentially_missed=False,
                    decision=None,
                )
            )
        except Exception:
            continue

    return spans


async def detect_llm(text: str, mode: str) -> list[Span]:
    load_backend_env()
    api_key = os.getenv("LLM_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("LLM_API_KEY is required when USE_LLM=true")

    base_url = os.getenv("LLM_BASE_URL", "https://api.deepseek.com").strip()
    model = os.getenv("LLM_MODEL", "deepseek-chat").strip() or "deepseek-chat"
    timeout_seconds = float(os.getenv("LLM_TIMEOUT_SECONDS", "30"))

    payload = {
        "model": model,
        "messages": [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": _build_prompt(text, mode)},
        ],
        "temperature": 0,
    }

    async with httpx.AsyncClient(timeout=timeout_seconds) as client:
        response = await client.post(
            _completion_url(base_url),
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
            },
            json=payload,
        )
        if response.status_code != 200:
            preview = response.text[:500]
            raise RuntimeError(
                f"LLM request failed with status {response.status_code}: {preview}"
            )
        content = response.json()["choices"][0]["message"]["content"]

    parsed = json.loads(_strip_json_fences(content))
    return _parse_spans(text, parsed)
