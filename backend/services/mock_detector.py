import re
from typing import Optional
from uuid import uuid4

from models import Span, SpanType


def find_span(text: str, target: str) -> Optional[tuple[int, int]]:
    start = text.find(target)
    if start == -1:
        return None
    return start, start + len(target)


def make_span(
    text: str,
    target: str,
    span_type: SpanType,
    confidence: float,
    explanation: str,
    pattern_matched: str,
    is_suggested: bool = True,
    potentially_missed: bool = False,
) -> Optional[Span]:
    match = find_span(text, target)
    if match is None:
        return None

    start, end = match
    return Span(
        id=str(uuid4()),
        start=start,
        end=end,
        text=text[start:end],
        type=span_type,
        confidence=confidence,
        explanation=explanation,
        pattern_matched=pattern_matched,
        is_suggested=is_suggested,
        potentially_missed=potentially_missed,
    )


def _trust_candidates(text: str) -> list[Span]:
    candidates = [
        make_span(
            text=text,
            target="Dr. Sarah Chen",
            span_type=SpanType.NAME,
            confidence=0.97,
            explanation="This appears to be a full personal name with a professional title.",
            pattern_matched="Exact seeded mock match for a clinician name.",
        ),
        make_span(
            text=text,
            target="s.chen@hospital.org",
            span_type=SpanType.EMAIL,
            confidence=0.99,
            explanation="This matches a standard email format tied to a likely individual account.",
            pattern_matched="Exact seeded mock match for an email address.",
        ),
        make_span(
            text=text,
            target="(415) 555-0194",
            span_type=SpanType.PHONE,
            confidence=0.95,
            explanation="This matches a North American phone number pattern.",
            pattern_matched="Exact seeded mock match for a formatted phone number.",
        ),
        make_span(
            text=text,
            target="482-73-1920",
            span_type=SpanType.SSN,
            confidence=0.88,
            explanation="This resembles a Social Security number pattern and is sensitive personal data.",
            pattern_matched="Exact seeded mock match for ###-##-####.",
        ),
        make_span(
            text=text,
            target="Stanford",
            span_type=SpanType.NAME,
            confidence=0.41,
            explanation="This is ambiguous because Stanford may refer to an institution rather than a person.",
            pattern_matched="Low-confidence seeded ambiguity check for proper nouns.",
        ),
    ]
    return [span for span in candidates if span is not None]


def _correction_candidates(text: str) -> list[Span]:
    candidates = [
        make_span(
            text=text,
            target="Patient Zero",
            span_type=SpanType.NAME,
            confidence=0.72,
            explanation="This looks name-like, but it may be a label or nickname rather than true PII.",
            pattern_matched="Seeded false-positive review candidate for correction mode.",
        ),
        make_span(
            text=text,
            target="December 14",
            span_type=SpanType.DATE_OF_BIRTH,
            confidence=0.61,
            explanation="This date fragment could indicate birth information, but it lacks enough context to be certain.",
            pattern_matched="Seeded ambiguous date detection for correction mode.",
        ),
        make_span(
            text=text,
            target="555-0147",
            span_type=SpanType.PHONE,
            confidence=0.82,
            explanation="This phone-like number may have been missed by the initial detector and needs human review.",
            pattern_matched="Seeded potentially missed local phone number.",
            is_suggested=False,
            potentially_missed=True,
        ),
        make_span(
            text=text,
            target="James Whitfield",
            span_type=SpanType.NAME,
            confidence=0.84,
            explanation="This appears to be a personal name that should likely be flagged for anonymization.",
            pattern_matched="Seeded potentially missed full-name detection.",
            is_suggested=False,
            potentially_missed=True,
        ),
    ]
    return [span for span in candidates if span is not None]


def _fallback_regex_detection(text: str) -> list[Span]:
    spans: list[Span] = []

    email_pattern = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
    phone_pattern = re.compile(
        r"(?:(?:\+?\d{1,2}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}|\b\d{3}[-.]\d{4}\b)"
    )
    id_pattern = re.compile(r"\b(?:EMP|ACC|CASE)-\d{5,}\b")
    name_pattern = re.compile(r"\b([A-Z][a-z]+ [A-Z][a-z]+)\b")
    address_pattern = re.compile(
        r"\b\d{1,5}\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\s+(?:Street|Avenue|Road|Lane|Drive|Boulevard|Court|Way)\b"
    )

    for match in email_pattern.finditer(text):
        spans.append(
            Span(
                id=str(uuid4()),
                start=match.start(),
                end=match.end(),
                text=match.group(0),
                type=SpanType.EMAIL,
                confidence=0.86,
                explanation="This matches a generic email address pattern.",
                pattern_matched="Regex fallback for email-like strings.",
            )
        )

    for match in phone_pattern.finditer(text):
        spans.append(
            Span(
                id=str(uuid4()),
                start=match.start(),
                end=match.end(),
                text=match.group(0),
                type=SpanType.PHONE,
                confidence=0.74,
                explanation="This matches a generic phone-like number pattern.",
                pattern_matched="Regex fallback for phone-like strings.",
            )
        )

    for match in id_pattern.finditer(text):
        spans.append(
            Span(
                id=str(uuid4()),
                start=match.start(),
                end=match.end(),
                text=match.group(0),
                type=SpanType.ID_NUMBER,
                confidence=0.83,
                explanation="This matches a structured employee, account, or case identifier format.",
                pattern_matched="Regex fallback for EMP/ACC/CASE identifiers.",
            )
        )

    for match in name_pattern.finditer(text):
        full_name = match.group(1)
        if full_name in {"Employee Onboarding", "Mission Street", "Park Avenue"}:
            continue
        spans.append(
            Span(
                id=str(uuid4()),
                start=match.start(1),
                end=match.end(1),
                text=full_name,
                type=SpanType.NAME,
                confidence=0.68,
                explanation="This matches a simple capitalized first-and-last-name pattern.",
                pattern_matched="Regex fallback for capitalized full names.",
            )
        )

    for match in address_pattern.finditer(text):
        spans.append(
            Span(
                id=str(uuid4()),
                start=match.start(),
                end=match.end(),
                text=match.group(0),
                type=SpanType.ADDRESS,
                confidence=0.79,
                explanation="This matches a simple street-address pattern with a numeric prefix.",
                pattern_matched="Regex fallback for street-style addresses.",
            )
        )

    spans.sort(key=lambda span: (span.start, span.end))
    deduplicated: list[Span] = []
    seen: set[tuple[int, int, SpanType]] = set()
    for span in spans:
        key = (span.start, span.end, span.type)
        if key in seen:
            continue
        seen.add(key)
        deduplicated.append(span)

    return deduplicated


def detect_mock(text: str, mode: str) -> list[Span]:
    if mode == "correction":
        spans = _correction_candidates(text)
    else:
        spans = _trust_candidates(text)

    if spans:
        return spans

    return _fallback_regex_detection(text)
