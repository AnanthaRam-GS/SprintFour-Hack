import json
import os
from typing import Any, Optional
from uuid import uuid4

import httpx

from config import load_backend_env
from models import Span, SpanType

SYSTEM_PROMPT = (
    "You are a strict PII detection engine. Return only valid JSON. "
    "Do not include explanations outside JSON."
)


def _build_prompt(text: str) -> str:
    return f"""Analyze the document and identify personally identifiable or sensitive information that should be reviewed before sharing with an AI tool.

Return ONLY a JSON array. Each item must be:
{{
  "text": "exact text from the document",
  "type": "NAME|EMAIL|PHONE|SSN|ADDRESS|DATE_OF_BIRTH|ID_NUMBER|CREDIT_CARD|OTHER",
  "confidence": 0.0-1.0,
  "explanation": "short reason",
  "pattern_matched": "semantic reason or pattern"
}}

Rules:
- Detect full person names such as David Wilson or Emma Rodriguez.
- Detect email addresses.
- Detect phone numbers.
- Detect employee IDs, account numbers, ticket IDs, insurance references, and case numbers as ID_NUMBER.
- Detect residential or mailing addresses as ADDRESS.
- Do not mark headings like "Client Investment Review", "Account Number", or "Residential Address" as names.
- For labels like "Account Number:" followed by "ACC-98176234", mark only the value ACC-98176234.
- For labels like "Residential Address:" followed by address lines, mark only the actual address lines.
- Use exact text from the document.
- If unsure, include the item with lower confidence.
- Return [] if there is no PII.

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


def _extract_json_array(content: str) -> str:
    cleaned = _strip_json_fences(content)
    start = cleaned.find("[")
    end = cleaned.rfind("]")
    if start == -1 or end == -1 or end < start:
        raise RuntimeError(
            f"LLM response did not contain a JSON array. Preview: {cleaned[:500]}"
        )
    return cleaned[start : end + 1]


def _coerce_span_type(raw_type: Any) -> SpanType:
    if isinstance(raw_type, str):
        normalized = raw_type.strip().upper()
        try:
            return SpanType(normalized)
        except ValueError:
            return SpanType.OTHER
    return SpanType.OTHER


def _coerce_confidence(value: Any) -> float:
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        return max(0.0, min(1.0, float(value)))
    return 0.0


def _find_unused_occurrence(
    text: str,
    span_text: str,
    used_ranges: list[tuple[int, int]],
) -> Optional[tuple[int, int]]:
    if not span_text:
        return None

    search_start = 0
    while True:
        start = text.find(span_text, search_start)
        if start == -1:
            return None

        end = start + len(span_text)
        overlaps_existing = any(start < used_end and end > used_start for used_start, used_end in used_ranges)
        if not overlaps_existing:
            return start, end
        search_start = start + 1


def _parse_spans(text: str, payload: Any) -> list[Span]:
    if not isinstance(payload, list):
        return []

    spans: list[Span] = []
    used_ranges: list[tuple[int, int]] = []

    for item in payload:
        if not isinstance(item, dict):
            continue

        span_text = item.get("text")
        if not isinstance(span_text, str):
            continue

        repaired = _find_unused_occurrence(text, span_text, used_ranges)
        if repaired is None:
            continue

        start, end = repaired
        used_ranges.append((start, end))

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
                    pattern_matched=str(item.get("pattern_matched") or "LLM semantic detection."),
                    is_suggested=True,
                    potentially_missed=False,
                    decision=None,
                )
            )
        except Exception:
            continue

    return spans


def _extract_content(response_json: dict[str, Any]) -> str:
    choices = response_json.get("choices")
    if not isinstance(choices, list) or not choices:
        raise RuntimeError(
            f"LLM response missing choices. Preview: {json.dumps(response_json)[:500]}"
        )

    first_choice = choices[0]
    if not isinstance(first_choice, dict):
        raise RuntimeError("LLM response choices[0] was not an object.")

    message = first_choice.get("message")
    if not isinstance(message, dict):
        raise RuntimeError(
            f"LLM response missing message content. Preview: {json.dumps(first_choice)[:500]}"
        )

    content = message.get("content")
    if isinstance(content, str):
        return content

    if isinstance(content, list):
        text_parts = [
            item.get("text", "")
            for item in content
            if isinstance(item, dict) and isinstance(item.get("text"), str)
        ]
        if text_parts:
            return "\n".join(text_parts)

    raise RuntimeError(
        f"LLM response missing usable content. Preview: {json.dumps(message)[:500]}"
    )


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
            {"role": "user", "content": _build_prompt(text)},
        ],
        "temperature": 0,
        "max_tokens": 1200,
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

        response_json = response.json()
        content = _extract_content(response_json)

    try:
        parsed = json.loads(_extract_json_array(content))
    except json.JSONDecodeError as error:
        raise RuntimeError(
            f"LLM returned unparsable JSON array: {error}. Preview: {content[:500]}"
        ) from error

    return _parse_spans(text, parsed)
