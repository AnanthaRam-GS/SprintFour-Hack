import { buildSegments } from "@/lib/spanUtils";
import type { Span } from "@/types";

import { SpanHighlight } from "./SpanHighlight";

type DocumentViewerProps = {
  text: string;
  spans: Span[];
  activeSpanId?: string | null;
  onSpanClick?: (span: Span) => void;
  className?: string;
};

export function DocumentViewer({
  text,
  spans,
  activeSpanId = null,
  onSpanClick,
  className = "",
}: DocumentViewerProps) {
  if (!text) {
    return (
      <section
        className={`rounded-3xl border border-dashed border-stone-200 bg-stone-50/50 p-8 text-sm text-stone-500 text-center leading-relaxed ${className}`}
      >
        No document text analyzed yet.
      </section>
    );
  }

  const segments = buildSegments(text, spans);

  return (
    <section
      className={`rounded-3xl border border-stone-200 bg-white p-8 text-sm leading-relaxed text-stone-800 shadow-sm ${className}`}
    >
      <div className="whitespace-pre-wrap break-words font-[family-name:var(--font-geist-sans)]">
        {segments.map((segment) => {
          if (segment.kind === "text") {
            return (
              <span
                key={`text-${segment.start}-${segment.end}`}
                data-segment-kind="text"
                data-start={segment.start}
                data-end={segment.end}
              >
                {segment.text}
              </span>
            );
          }

          return (
            <SpanHighlight
              key={segment.span.id}
              span={segment.span}
              isActive={segment.span.id === activeSpanId}
              onClick={onSpanClick}
            >
              {segment.text}
            </SpanHighlight>
          );
        })}
      </div>
    </section>
  );
}
