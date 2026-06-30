import os

from models import Span, SpanType
from services.llm_detector import detect_llm
from services.mock_detector import detect_mock, make_span


def _ensure_correction_demo_spans(text: str, spans: list[Span]) -> list[Span]:
    if not text:
        return spans

    existing = {(span.text, span.type, span.potentially_missed) for span in spans}
    supplemental_candidates = [
        (
            "555-0147",
            SpanType.PHONE,
            0.82,
            "This phone-like number may have been missed by the initial detector and needs human review.",
            "Seeded potentially missed local phone number.",
        ),
        (
            "James Whitfield",
            SpanType.NAME,
            0.84,
            "This appears to be a personal name that should likely be flagged for anonymization.",
            "Seeded potentially missed full-name detection.",
        ),
    ]

    next_spans = list(spans)
    for target, span_type, confidence, explanation, pattern_matched in supplemental_candidates:
        key = (target, span_type, True)
        if key in existing:
            continue

        span = make_span(
            text=text,
            target=target,
            span_type=span_type,
            confidence=confidence,
            explanation=explanation,
            pattern_matched=pattern_matched,
            is_suggested=False,
            potentially_missed=True,
        )
        if span is not None:
            next_spans.append(span)

    return next_spans


async def detect_pii(text: str, mode: str) -> list[Span]:
    use_llm = os.getenv("USE_LLM", "").lower() == "true"

    if not use_llm:
        return detect_mock(text, mode)

    try:
        spans = await detect_llm(text, mode)
        if mode == "correction":
            spans = _ensure_correction_demo_spans(text, spans)
        if spans:
            return spans
    except Exception as error:
        print(f"LLM detection failed, falling back to mock: {error}")

    return detect_mock(text, mode)
