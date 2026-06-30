import { ConfidenceBadge } from "@/components/shared/ConfidenceBadge";
import { getSpanTypeLabel } from "@/lib/spanUtils";
import type { Span } from "@/types";

type MissedPIIBannerProps = {
  missedSpans: Span[];
  acknowledged: boolean;
  onAcknowledge: () => void;
  onSelectSpan: (span: Span) => void;
};

export function MissedPIIBanner({
  missedSpans,
  acknowledged,
  onAcknowledge,
  onSelectSpan,
}: MissedPIIBannerProps) {
  if (acknowledged) {
    return (
      <section className="rounded-[2rem] border border-stone-200 bg-stone-50/50 px-6 py-4 text-xs font-medium text-stone-500 text-center">
        Secondary scan warnings have been acknowledged.
      </section>
    );
  }

  if (missedSpans.length === 0) {
    return (
      <section className="rounded-[2rem] border border-emerald-250 bg-emerald-50/40 px-6 py-4 text-xs font-semibold text-emerald-800 text-center">
        No potential missed PII detected by the correction validator.
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-amber-200/70 bg-amber-50/30 p-6 shadow-sm">
      <div className="flex flex-col gap-4">
        <div>
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-800 border border-amber-200/50">
            Validator Warning
          </span>
          <h2 className="mt-3 text-lg font-bold text-stone-900 tracking-tight">
            Possible Missed sensitive data
          </h2>
          <p className="mt-2 text-xs leading-relaxed text-stone-600">
            A secondary heuristics validation run suggests the document might still contain unredacted identifiers. Review these items to guarantee maximum document safety.
          </p>
          <p className="mt-2.5 text-xs font-bold text-amber-800">
            {missedSpans.length} item{missedSpans.length === 1 ? "" : "s"} requiring mandatory verification.
          </p>
        </div>

        <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {missedSpans.slice(0, 3).map((span) => (
            <button
              key={span.id}
              type="button"
              onClick={() => onSelectSpan(span)}
              className="flex items-center justify-between gap-3 rounded-2xl border border-amber-200/50 bg-white px-4 py-3 text-left transition hover:border-amber-400 hover:shadow-sm"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-stone-900 truncate">
                  &quot;{span.text}&quot;
                </p>
                <p className="mt-0.5 text-xs text-stone-500">
                  {getSpanTypeLabel(span.type)}
                </p>
              </div>
              <ConfidenceBadge confidence={span.confidence} />
            </button>
          ))}
        </div>

        <div className="border-t border-amber-200/30 pt-4">
          <button
            type="button"
            onClick={onAcknowledge}
            className="rounded-full bg-stone-900 px-5 py-2 text-xs font-semibold text-white transition hover:bg-stone-800"
          >
            Acknowledge warning
          </button>
        </div>
      </div>
    </section>
  );
}
