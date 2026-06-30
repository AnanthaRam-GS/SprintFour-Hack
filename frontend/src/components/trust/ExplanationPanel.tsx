import { getSpanTypeLabel } from "@/lib/spanUtils";
import type { Span } from "@/types";

import { ConfidenceBadge } from "@/components/shared/ConfidenceBadge";

type ExplanationPanelProps = {
  activeSpan: Span | null;
};

function getOriginLabel(span: Span): string {
  if (span.potentially_missed) {
    return "Potentially missed PII";
  }
  if (!span.is_suggested) {
    return "Manually added";
  }
  return "Suggested by detector";
}

export function ExplanationPanel({ activeSpan }: ExplanationPanelProps) {
  if (!activeSpan) {
    return (
      <aside className="rounded-[2rem] border border-dashed border-stone-300 bg-stone-50 p-6 text-sm leading-7 text-stone-500">
        Select a highlighted item to understand why it was flagged.
      </aside>
    );
  }

  return (
    <aside className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
      <div className="space-y-5">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-stone-500">
            Explanation
          </p>
          <p className="mt-3 text-xl font-semibold text-stone-950">
            &quot;{activeSpan.text}&quot;
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-700">
            {getSpanTypeLabel(activeSpan.type)}
          </span>
          <ConfidenceBadge confidence={activeSpan.confidence} />
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800">
            {getOriginLabel(activeSpan)}
          </span>
        </div>

        <div className="space-y-4 text-sm leading-7 text-stone-700">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
              Why it was flagged
            </p>
            <p className="mt-2">{activeSpan.explanation}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
              Pattern matched
            </p>
            <p className="mt-2">{activeSpan.pattern_matched}</p>
          </div>

          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
              Trust note
            </p>
            <p className="mt-2 text-stone-600">
              This explanation is shown so the redaction decision can be
              reviewed instead of blindly trusted.
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
