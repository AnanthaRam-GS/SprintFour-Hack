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
      <section className="rounded-[2rem] border border-dashed border-stone-200 bg-stone-50/50 p-6 text-xs text-stone-500 text-center leading-relaxed">
        Select a highlighted document element to activate the audit panel.
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-stone-200/80 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-stone-400">
            <span>{getSpanTypeLabel(activeSpan.type)}</span>
            <ConfidenceBadge confidence={activeSpan.confidence} />
          </div>
          <p className="text-base font-bold text-stone-900 truncate">
            &quot;{activeSpan.text}&quot;
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => onAccept(activeSpan)}
            className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-emerald-700 shadow-sm"
          >
            Accept
          </button>
          <button
            type="button"
            onClick={() => onReject(activeSpan)}
            className="rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-stone-855 shadow-sm"
          >
            Reject
          </button>
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50 disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-300"
          >
            Undo
          </button>
        </div>
      </div>
    </section>
  );
}
