import { getSpanTypeLabel } from "@/lib/spanUtils";
import type { Span } from "@/types";

import { ConfidenceBadge } from "./ConfidenceBadge";

type ActionBarProps = {
  activeSpan: Span | null;
  onAccept: (span: Span) => void;
  onReject: (span: Span) => void;
  onUndo: () => void;
  canUndo?: boolean;
};

export function ActionBar({
  activeSpan,
  onAccept,
  onReject,
  onUndo,
  canUndo = false,
}: ActionBarProps) {
  if (!activeSpan) {
    return (
      <section className="rounded-3xl border border-dashed border-stone-300 bg-stone-50 px-5 py-4 text-sm text-stone-500">
        Select a highlighted span to review it.
      </section>
    );
  }

  return (
    <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-[0.2em] text-stone-500">
            <span>{getSpanTypeLabel(activeSpan.type)}</span>
            <ConfidenceBadge confidence={activeSpan.confidence} />
          </div>
          <p className="text-base font-medium text-stone-900">
            &quot;{activeSpan.text}&quot;
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => onAccept(activeSpan)}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            Accept Redaction
          </button>
          <button
            type="button"
            onClick={() => onReject(activeSpan)}
            className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-700"
          >
            Reject Redaction
          </button>
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-400"
          >
            Undo
          </button>
        </div>
      </div>
    </section>
  );
}
