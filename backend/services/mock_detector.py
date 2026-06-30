import re
from typing import Optional
from uuid import uuid4

from models import Span, SpanType

BLOCKED_NAME_PHRASES = {
    "Client Investment",
    "Client Investment Review",
    "Employee Onboarding",
    "Employee Onboarding Summary",
    "Patient intake summary",
    "Support Case Summary",
    "Account Number",
    "Residential Address",
    "Primary contact",
    "Emergency contact",
    "Project Phoenix",
    "New York",
    "San Francisco",
    "Stanford",
    "Riverside Medical Center",
    "Engineering team",
    "Priority High",
}

NAME_CONTEXT_LABELS = {
    "Prepared for",
    "Customer",
    "Candidate",
    "Patient",
    "Representative",
    "Consultant",
    "Emergency contact",
    "Contact",
    "Prepared by",
    "Reviewed by",
    "Employee",
    "Client",
}

NAME_BLOCKLIST_WORDS = {
    "summary",
    "review",
    "address",
    "number",
    "contact",
    "project",
    "priority",
    "phone",
    "email",
    "account",
    "ticket",
    "invoice",
    "insurance",
    "reference",
    "id",
    "residential",
    "support",
}

TITLE_NAME_PATTERN = re.compile(
    r"\b(?:Dr|Mr|Ms|Mrs)\.\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+\b"
)
EMAIL_PATTERN = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
LONG_PHONE_PATTERN = re.compile(
    r"(?<!\w)(?:\+?\d{1,2}[\s.-]?)?(?:\(\d{3}\)|\d{3})[\s.-]?\d{3}[\s.-]?\d{4}(?!\w)"
)
SHORT_PHONE_PATTERN = re.compile(r"(?<!\d)\d{3}[-.]\d{4}(?!\d)")
SSN_PATTERN = re.compile(r"\b\d{3}-\d{2}-\d{4}\b")
ID_PATTERN = re.compile(r"\b(?:EMP|ACC|CASE|INS|INV|ID|TICKET|POLICY|REF)-[A-Z0-9]+\b")
ADDRESS_LINE_PATTERN = re.compile(
    r"\b\d{1,5}[A-Z]?\s+(?:[A-Z][A-Za-z0-9.'-]*\s+){0,4}(?:Street|St|Avenue|Ave|Road|Rd|Lane|Ln|Drive|Dr|Boulevard|Blvd|Park|Nagar)\b"
)
CITY_STATE_ZIP_PATTERN = re.compile(
    r"\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*,\s*[A-Z]{2}\s+\d{5,6}\b"
)
DOB_LABEL_PATTERN = re.compile(
    r"(?im)\b(?:Date of Birth|DOB|Birth Date)\b\s*:\s*([A-Za-z]{3,9}\s+\d{1,2},\s+\d{4}|\d{1,2}\s+[A-Za-z]{3,9}\s+\d{4})"
)
FULL_NAME_PATTERN = re.compile(r"\b[A-Z][a-z]+ [A-Z][a-z]+\b")
LEADING_NAME_PATTERN = re.compile(
    r"(?m)^([A-Z][a-z]+ [A-Z][a-z]+)\s+(?:completed|met|called|reviewed|confirmed|joined|spoke|contacted|submitted|requested|escalated)\b"
)


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


def _build_span(
    text: str,
    start: int,
    end: int,
    span_type: SpanType,
    confidence: float,
    explanation: str,
    pattern_matched: str,
    is_suggested: bool = True,
    potentially_missed: bool = False,
) -> Span:
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
            pattern_matched="Seeded title pattern for built-in trust sample.",
        ),
        make_span(
            text=text,
            target="s.chen@hospital.org",
            span_type=SpanType.EMAIL,
            confidence=0.99,
            explanation="Detected as an email address.",
            pattern_matched="Seeded email pattern for built-in trust sample.",
        ),
        make_span(
            text=text,
            target="(415) 555-0194",
            span_type=SpanType.PHONE,
            confidence=0.95,
            explanation="Detected as a phone number.",
            pattern_matched="Seeded phone-number pattern for built-in trust sample.",
        ),
        make_span(
            text=text,
            target="482-73-1920",
            span_type=SpanType.SSN,
            confidence=0.95,
            explanation="Detected as a Social Security number.",
            pattern_matched="Seeded SSN pattern for built-in trust sample.",
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


def _is_blocked_name(value: str) -> bool:
    cleaned = value.strip()
    if not cleaned or cleaned in BLOCKED_NAME_PHRASES:
        return True

    lowered = cleaned.lower()
    if lowered.endswith(":"):
        return True

    tokens = set(re.findall(r"[a-z]+", lowered))
    if NAME_BLOCKLIST_WORDS & tokens:
        return True

    return False


def _collect_pattern_spans(text: str) -> list[Span]:
    spans: list[Span] = []
    phone_ranges: list[tuple[int, int]] = []

    for match in EMAIL_PATTERN.finditer(text):
        spans.append(
            _build_span(
                text,
                match.start(),
                match.end(),
                SpanType.EMAIL,
                0.99,
                "Detected as an email address.",
                "Regex email pattern.",
            )
        )

    for match in LONG_PHONE_PATTERN.finditer(text):
        candidate = match.group(0).rstrip(".,;:")
        start = match.start()
        end = start + len(candidate)
        phone_ranges.append((start, end))
        spans.append(
            _build_span(
                text,
                start,
                end,
                SpanType.PHONE,
                0.95,
                "Detected as a phone number.",
                "Regex phone-number pattern.",
            )
        )

    for match in SHORT_PHONE_PATTERN.finditer(text):
        start = match.start()
        end = match.end()
        if any(start < used_end and end > used_start for used_start, used_end in phone_ranges):
            continue
        spans.append(
            _build_span(
                text,
                start,
                end,
                SpanType.PHONE,
                0.95,
                "Detected as a phone number.",
                "Regex local phone-number pattern.",
            )
        )

    for match in SSN_PATTERN.finditer(text):
        spans.append(
            _build_span(
                text,
                match.start(),
                match.end(),
                SpanType.SSN,
                0.95,
                "Detected as a Social Security number.",
                "Regex SSN pattern ###-##-####.",
            )
        )

    for match in ID_PATTERN.finditer(text):
        spans.append(
            _build_span(
                text,
                match.start(),
                match.end(),
                SpanType.ID_NUMBER,
                0.9,
                "Detected as an identifier value.",
                "Regex identifier pattern for EMP/ACC/CASE/INS/INV/ID/TICKET/POLICY/REF.",
            )
        )

    for match in TITLE_NAME_PATTERN.finditer(text):
        spans.append(
            _build_span(
                text,
                match.start(),
                match.end(),
                SpanType.NAME,
                0.97,
                "Detected as a person name with a professional or personal title.",
                "Title-based name pattern.",
            )
        )

    return spans


def _collect_address_spans(text: str) -> list[Span]:
    spans: list[Span] = []
    address_matches: list[tuple[int, int]] = []

    for match in ADDRESS_LINE_PATTERN.finditer(text):
        spans.append(
            _build_span(
                text,
                match.start(),
                match.end(),
                SpanType.ADDRESS,
                0.88,
                "Detected as a street address line.",
                "Street-address line pattern.",
            )
        )
        address_matches.append((match.start(), match.end()))

    lines = text.splitlines(keepends=True)
    offset = 0
    for index, line in enumerate(lines):
        line_start = offset
        line_end = offset + len(line)
        stripped = line.strip()
        offset = line_end

        if not stripped or stripped.endswith(":"):
            continue

        city_match = CITY_STATE_ZIP_PATTERN.fullmatch(stripped)
        if city_match is None:
            continue

        previous_has_address = False
        for prev_index in range(index - 1, -1, -1):
            previous_line = lines[prev_index].strip()
            if not previous_line:
                continue
            previous_has_address = any(
                match_start >= sum(len(item) for item in lines[:prev_index])
                and match_end <= sum(len(item) for item in lines[: prev_index + 1])
                for match_start, match_end in address_matches
            )
            break

        if not previous_has_address:
            continue

        value_start = line_start + line.index(stripped)
        value_end = value_start + len(stripped)
        spans.append(
            _build_span(
                text,
                value_start,
                value_end,
                SpanType.ADDRESS,
                0.88,
                "Detected as a city, state, and postal code line following an address.",
                "City/state/postal pattern following address line.",
            )
        )

    return spans


def _collect_context_name_spans(text: str) -> list[Span]:
    spans: list[Span] = []
    lines = text.splitlines(keepends=True)
    offsets: list[int] = []
    cursor = 0
    for line in lines:
        offsets.append(cursor)
        cursor += len(line)

    for index, line in enumerate(lines):
        stripped = line.strip()
        if not stripped:
            continue

        for label in NAME_CONTEXT_LABELS:
            prefix = f"{label}:"
            if stripped.startswith(prefix):
                value = stripped[len(prefix) :].strip()
                if value:
                    name_match = FULL_NAME_PATTERN.search(value)
                    candidate = name_match.group(0) if name_match else ""
                else:
                    candidate = ""

                if candidate and not _is_blocked_name(candidate):
                    line_start = offsets[index] + line.index(candidate)
                    spans.append(
                        _build_span(
                            text,
                            line_start,
                            line_start + len(candidate),
                            SpanType.NAME,
                            0.92,
                            "Detected as a person name from surrounding label context.",
                            f"Same-line context label: {label}.",
                        )
                    )
                elif not value:
                    for next_index in range(index + 1, len(lines)):
                        next_value = lines[next_index].strip()
                        if not next_value:
                            continue
                        if FULL_NAME_PATTERN.fullmatch(next_value) and not _is_blocked_name(next_value):
                            line_start = offsets[next_index] + lines[next_index].index(next_value)
                            spans.append(
                                _build_span(
                                    text,
                                    line_start,
                                    line_start + len(next_value),
                                    SpanType.NAME,
                                    0.92,
                                    "Detected as a person name from surrounding label context.",
                                    f"Next-line context label: {label}.",
                                )
                            )
                        break

    return spans


def _collect_leading_name_spans(text: str) -> list[Span]:
    spans: list[Span] = []
    for match in LEADING_NAME_PATTERN.finditer(text):
        candidate = match.group(1)
        if _is_blocked_name(candidate):
            continue
        spans.append(
            _build_span(
                text,
                match.start(1),
                match.end(1),
                SpanType.NAME,
                0.88,
                "Detected as a person name from sentence-leading context.",
                "Sentence-leading full-name pattern before an action verb.",
            )
        )
    return spans


def _collect_dob_spans(text: str) -> list[Span]:
    spans: list[Span] = []
    for match in DOB_LABEL_PATTERN.finditer(text):
        value = match.group(1)
        if not value:
            continue
        value_start = match.start(1)
        spans.append(
            _build_span(
                text,
                value_start,
                value_start + len(value),
                SpanType.DATE_OF_BIRTH,
                0.9,
                "Detected as date of birth based on nearby label.",
                "DOB/Date of Birth/Birth Date label context.",
            )
        )
    return spans


def _deduplicate_spans(spans: list[Span]) -> list[Span]:
    ranked = sorted(
        spans,
        key=lambda span: (
            span.start,
            -span.confidence,
            -(span.end - span.start),
            span.type.value,
        ),
    )

    unique: list[Span] = []
    for span in ranked:
        if any(
            existing.start == span.start
            and existing.end == span.end
            and existing.type == span.type
            for existing in unique
        ):
            continue

        overlapping_index: Optional[int] = None
        for index, existing in enumerate(unique):
            if span.start < existing.end and span.end > existing.start:
                overlapping_index = index
                break

        if overlapping_index is None:
            unique.append(span)
            continue

        existing = unique[overlapping_index]
        current_score = (span.confidence, span.end - span.start)
        existing_score = (existing.confidence, existing.end - existing.start)
        if current_score > existing_score:
            unique[overlapping_index] = span

    return sorted(unique, key=lambda span: (span.start, span.end))


def _heuristic_fallback_detection(text: str, mode: str) -> list[Span]:
    spans = []
    spans.extend(_collect_pattern_spans(text))
    spans.extend(_collect_address_spans(text))
    spans.extend(_collect_context_name_spans(text))
    spans.extend(_collect_leading_name_spans(text))
    spans.extend(_collect_dob_spans(text))

    if mode == "correction":
        for target in ("Olivia Turner", "Daniel Brooks"):
            span = make_span(
                text=text,
                target=target,
                span_type=SpanType.NAME,
                confidence=0.9,
                explanation="Detected as a person name from correction-mode review context.",
                pattern_matched="Correction-mode seeded name stabilization.",
                is_suggested=False,
                potentially_missed=True,
            )
            if span is not None:
                spans.append(span)
        span = make_span(
            text=text,
            target="555-0198",
            span_type=SpanType.PHONE,
            confidence=0.9,
            explanation="Detected as a phone number from correction-mode review context.",
            pattern_matched="Correction-mode seeded phone stabilization.",
            is_suggested=False,
            potentially_missed=True,
        )
        if span is not None:
            spans.append(span)

    return _deduplicate_spans(spans)


def detect_mock(text: str, mode: str) -> list[Span]:
    seeded_spans = _correction_candidates(text) if mode == "correction" else _trust_candidates(text)
    heuristic_spans = _heuristic_fallback_detection(text, mode)
    combined = seeded_spans + heuristic_spans
    return _deduplicate_spans(combined)
