import type { Span, SpanType } from "@/types";

type TextSegment = {
  kind: "text";
  text: string;
  start: number;
  end: number;
};

type SpanSegment = {
  kind: "span";
  text: string;
  start: number;
  end: number;
  span: Span;
};

export type Segment = TextSegment | SpanSegment;

export function normalizeSpans(text: string, spans: Span[]): Span[] {
  if (!text || spans.length === 0) {
    return [];
  }

  const textLength = text.length;
  const clampedSpans = spans
    .map((span) => {
      const start = Math.max(0, Math.min(span.start, textLength));
      const end = Math.max(0, Math.min(span.end, textLength));

      if (end <= start) {
        return null;
      }

      return {
        ...span,
        start,
        end,
        text: text.slice(start, end),
      };
    })
    .filter((span): span is Span => span !== null)
    .sort((left, right) => {
      if (left.start !== right.start) {
        return left.start - right.start;
      }
      return right.end - left.end;
    });

  const normalized: Span[] = [];

  for (const span of clampedSpans) {
    const previousSpan = normalized.at(-1);
    if (previousSpan && span.start < previousSpan.end) {
      continue;
    }
    normalized.push(span);
  }

  return normalized;
}

export function buildSegments(text: string, spans: Span[]): Segment[] {
  if (!text) {
    return [];
  }

  const normalizedSpans = normalizeSpans(text, spans);
  if (normalizedSpans.length === 0) {
    return [
      {
        kind: "text",
        text,
        start: 0,
        end: text.length,
      },
    ];
  }

  const segments: Segment[] = [];
  let cursor = 0;

  for (const span of normalizedSpans) {
    if (cursor < span.start) {
      segments.push({
        kind: "text",
        text: text.slice(cursor, span.start),
        start: cursor,
        end: span.start,
      });
    }

    segments.push({
      kind: "span",
      text: text.slice(span.start, span.end),
      start: span.start,
      end: span.end,
      span,
    });

    cursor = span.end;
  }

  if (cursor < text.length) {
    segments.push({
      kind: "text",
      text: text.slice(cursor),
      start: cursor,
      end: text.length,
    });
  }

  return segments;
}

export function overlapsRange(span: Span, start: number, end: number): boolean {
  return span.start < end && span.end > start;
}

export function getSpanTypeLabel(type: SpanType): string {
  const specialLabels: Partial<Record<SpanType, string>> = {
    DATE_OF_BIRTH: "Date of Birth",
    ID_NUMBER: "ID Number",
    CREDIT_CARD: "Credit Card",
  };

  if (specialLabels[type]) {
    return specialLabels[type] as string;
  }

  return type
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
