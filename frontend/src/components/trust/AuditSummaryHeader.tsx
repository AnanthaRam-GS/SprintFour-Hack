import { getSpanTypeLabel } from "@/lib/spanUtils";
import type { Span, SpanType } from "@/types";

type AuditSummaryHeaderProps = {
  spans: Span[];
  threshold: number;
};

function isVisible(span: Span, threshold: number): boolean {
  return span.potentially_missed || span.confidence * 100 >= threshold;
}

export function AuditSummaryHeader({
  spans,
  threshold,
}: AuditSummaryHeaderProps) {
  const visibleCount = spans.filter((span) => isVisible(span, threshold)).length;
  const belowThresholdCount = spans.length - visibleCount;

  const countsByType = spans.reduce(
    (accumulator, span) => {
      accumulator[span.type] = (accumulator[span.type] ?? 0) + 1;
      return accumulator;
    },
    {} as Partial<Record<SpanType, number>>,
  );

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[repeat(3,minmax(0,1fr))_minmax(0,1.4fr)]">
        <div className="rounded-2xl bg-stone-100 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            Total spans
          </p>
          <p className="mt-2 text-2xl font-semibold text-stone-950">
            {spans.length}
          </p>
        </div>
        <div className="rounded-2xl bg-emerald-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Visible now
          </p>
          <p className="mt-2 text-2xl font-semibold text-emerald-900">
            {visibleCount}
          </p>
        </div>
        <div className="rounded-2xl bg-amber-50 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
            Below threshold
          </p>
          <p className="mt-2 text-2xl font-semibold text-amber-900">
            {belowThresholdCount}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            By PII type
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(countsByType).map(([type, count]) => (
              <span
                key={type}
                className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700"
              >
                {getSpanTypeLabel(type as SpanType)}: {count}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
