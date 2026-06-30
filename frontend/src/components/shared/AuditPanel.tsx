import { getSpanTypeLabel } from "@/lib/spanUtils";
import type { Span, SpanAction } from "@/types";

type AuditPanelProps = {
  spans: Span[];
  decisions: Record<string, SpanAction>;
  className?: string;
};

type AuditItem = {
  span: Span;
  action: SpanAction;
};

function getActionClasses(action: SpanAction): string {
  if (action === "accept") {
    return "border-emerald-200 bg-emerald-50 text-emerald-950";
  }
  if (action === "reject") {
    return "border-stone-200 bg-stone-100 text-stone-800";
  }
  return "border-violet-200 bg-violet-50 text-violet-950";
}

export function AuditPanel({
  spans,
  decisions,
  className = "",
}: AuditPanelProps) {
  const items: AuditItem[] = spans.flatMap((span) => {
    const action = decisions[span.id];
    return action ? [{ span, action }] : [];
  });

  if (items.length === 0) {
    return (
      <aside
        className={`rounded-[2rem] border border-dashed border-stone-200 bg-stone-50/50 p-6 text-xs text-stone-500 text-center leading-relaxed ${className}`}
      >
        No review actions audited.
      </aside>
    );
  }

  return (
    <aside
      className={`rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm ${className}`}
    >
      <div className="space-y-3">
        {items.map(({ span, action }) => (
          <div
            key={`${span.id}-${action}`}
            className={`rounded-2xl border p-3 ${getActionClasses(action)}`}
          >
            <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.2em]">
              <span>{action}</span>
              <span>{Math.round(span.confidence * 100)}%</span>
            </div>
            <p className="mt-2 text-sm font-medium">&quot;{span.text}&quot;</p>
            <p className="mt-1 text-xs opacity-80">
              {getSpanTypeLabel(span.type)}
            </p>
          </div>
        ))}
      </div>
    </aside>
  );
}
