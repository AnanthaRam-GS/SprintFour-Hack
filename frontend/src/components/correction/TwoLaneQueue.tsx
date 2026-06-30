import { ConfidenceBadge } from "@/components/shared/ConfidenceBadge";
import { getSpanTypeLabel } from "@/lib/spanUtils";
import type { Span } from "@/types";

type TwoLaneQueueProps = {
  spans: Span[];
  activeSpanId: string | null;
  onSelectSpan: (span: Span) => void;
  onAccept: (span: Span) => void;
  onReject: (span: Span) => void;
};

type QueueLaneProps = {
  title: string;
  description: string;
  spans: Span[];
  activeSpanId: string | null;
  onSelectSpan: (span: Span) => void;
  onAccept: (span: Span) => void;
  onReject: (span: Span) => void;
  emptyMessage: string;
};

function QueueLane({
  title,
  description,
  spans,
  activeSpanId,
  onSelectSpan,
  onAccept,
  onReject,
  emptyMessage,
}: QueueLaneProps) {
  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
      <div className="border-b border-stone-100 pb-3">
        <h3 className="text-sm font-bold uppercase tracking-[0.1em] text-stone-900">
          {title}
        </h3>
        <p className="mt-1 text-xs text-stone-500">{description}</p>
      </div>

      <div className="mt-4 space-y-3">
        {spans.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 px-4 py-6 text-center text-xs text-stone-400">
            {emptyMessage}
          </div>
        ) : (
          spans.map((span) => {
            const isActive = span.id === activeSpanId;

            return (
              <div
                key={span.id}
                className={`rounded-2xl border p-4 transition-all duration-200 ${
                  isActive
                    ? "border-stone-950 bg-stone-950 text-white shadow-md"
                    : "border-stone-200 bg-stone-50/50 hover:bg-white text-stone-900"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectSpan(span)}
                  className="w-full text-left"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">&quot;{span.text}&quot;</p>
                      <p
                        className={`mt-1 text-xs font-medium uppercase tracking-wider ${
                          isActive ? "text-stone-300" : "text-stone-500"
                        }`}
                      >
                        {getSpanTypeLabel(span.type)}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <ConfidenceBadge confidence={span.confidence} />
                      {span.decision ? (
                        <span
                          className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.15em] ${
                            isActive
                              ? "bg-white/15 text-white"
                              : "bg-stone-200 text-stone-600 border border-stone-300/40"
                          }`}
                        >
                          {span.decision}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>

                <div className="mt-4 flex flex-wrap gap-2 border-t border-stone-100/10 pt-3">
                  <button
                    type="button"
                    onClick={() => onAccept(span)}
                    className="rounded-full bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 transition"
                  >
                    Accept
                  </button>
                  <button
                    type="button"
                    onClick={() => onReject(span)}
                    className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? "bg-white/10 text-white hover:bg-white/20"
                        : "bg-stone-900 text-white hover:bg-stone-800"
                    }`}
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

export function TwoLaneQueue({
  spans,
  activeSpanId,
  onSelectSpan,
  onAccept,
  onReject,
}: TwoLaneQueueProps) {
  const falsePositiveCandidates = spans.filter(
    (span) =>
      span.is_suggested &&
      span.confidence < 0.75 &&
      span.potentially_missed !== true,
  );
  const missedPiiCandidates = spans.filter((span) => span.potentially_missed);

  return (
    <div className="space-y-6">
      <QueueLane
        title="False positive candidates"
        description="Review low-confidence redactions that may be harmless."
        spans={falsePositiveCandidates}
        activeSpanId={activeSpanId}
        onSelectSpan={onSelectSpan}
        onAccept={onAccept}
        onReject={onReject}
        emptyMessage="No low-confidence false-positive candidates right now."
      />

      <QueueLane
        title="Missed PII candidates"
        description="Review sensitive-looking text the tool may have left visible."
        spans={missedPiiCandidates}
        activeSpanId={activeSpanId}
        onSelectSpan={onSelectSpan}
        onAccept={onAccept}
        onReject={onReject}
        emptyMessage="No likely missed PII items need review."
      />
    </div>
  );
}
