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
      <section className="rounded-[2rem] border border-stone-200 bg-stone-50 px-5 py-4 text-sm text-stone-600">
        Missed PII warning acknowledged.
      </section>
    );
  }

  if (missedSpans.length === 0) {
    return (
      <section className="rounded-[2rem] border border-emerald-200 bg-emerald-50 px-5 py-4 text-sm text-emerald-800">
        No likely missed PII found in the secondary scan.
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-5 shadow-sm">
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
            Possible missed PII needs review
          </p>
          <p className="mt-2 text-sm leading-7 text-amber-950">
            The tool may have left sensitive text visible. Review these items
            before exporting so important information is not missed.
          </p>
          <p className="mt-2 text-sm font-medium text-amber-800">
            {missedSpans.length} possible missed item
            {missedSpans.length === 1 ? "" : "s"} detected
          </p>
        </div>

        <div className="space-y-2">
          {missedSpans.slice(0, 3).map((span) => (
            <button
              key={span.id}
              type="button"
              onClick={() => onSelectSpan(span)}
              className="flex w-full items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-white px-4 py-3 text-left transition hover:border-amber-300 hover:bg-amber-100/40"
            >
              <div>
                <p className="text-sm font-medium text-stone-900">
                  &quot;{span.text}&quot;
                </p>
                <p className="mt-1 text-xs text-stone-600">
                  {getSpanTypeLabel(span.type)}
                </p>
              </div>
              <ConfidenceBadge confidence={span.confidence} />
            </button>
          ))}
        </div>

        <div>
          <button
            type="button"
            onClick={onAcknowledge}
            className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            I understand, proceed
          </button>
        </div>
      </div>
    </section>
  );
}
