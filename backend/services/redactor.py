from models import Span


def redact_text(text: str, spans: list[Span]) -> str:
    if not text or not spans:
        return text

    text_length = len(text)
    approved_spans = []

    for span in spans:
        if span.decision not in {"accept", "add"}:
            continue

        start = max(0, span.start)
        end = min(text_length, span.end)
        if end <= start:
            continue

        approved_spans.append(
            {
                "start": start,
                "end": end,
                "replacement": f"[REDACTED-{span.type}]",
            }
        )

    approved_spans.sort(
        key=lambda item: (item["start"], -(item["end"] - item["start"]))
    )

    non_overlapping = []
    covered_until = -1
    for item in approved_spans:
        if item["start"] < covered_until:
            continue
        non_overlapping.append(item)
        covered_until = item["end"]

    redacted_text = text
    for item in sorted(non_overlapping, key=lambda span: span["start"], reverse=True):
        redacted_text = (
            redacted_text[: item["start"]]
            + item["replacement"]
            + redacted_text[item["end"] :]
        )

    return redacted_text
