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
    <section className="rounded-[2rem] border border-stone-200/80 bg-white p-6 shadow-sm">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-stone-50 border border-stone-100 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
            Total spans
          </p>
          <p className="mt-2 text-3xl font-extrabold text-stone-900 leading-none">
            {spans.length}
          </p>
        </div>
        <div className="rounded-2xl bg-emerald-50/50 border border-emerald-100/50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
            Visible now
          </p>
          <p className="mt-2 text-3xl font-extrabold text-emerald-900 leading-none">
            {visibleCount}
          </p>
        </div>
        <div className="rounded-2xl bg-amber-50/50 border border-amber-100/50 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
            Below threshold
          </p>
          <p className="mt-2 text-3xl font-extrabold text-amber-900 leading-none">
            {belowThresholdCount}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-100 bg-stone-50/20 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
            By PII type
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(countsByType).map(([type, count]) => (
              <span
                key={type}
                className="rounded-full bg-white border border-stone-200 px-2.5 py-0.5 text-xs font-medium text-stone-600 animate-fade-in"
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
