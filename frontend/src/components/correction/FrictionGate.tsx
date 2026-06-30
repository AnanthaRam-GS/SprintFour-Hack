"use client";

import * as Dialog from "@radix-ui/react-dialog";

import { ConfidenceBadge } from "@/components/shared/ConfidenceBadge";
import { getSpanTypeLabel } from "@/lib/spanUtils";
import type { Span } from "@/types";

type FrictionGateProps = {
  open: boolean;
  pendingLowConfidenceSpans: Span[];
  onConfirm: () => void;
  onCancel: () => void;
};

export function FrictionGate({
  open,
  pendingLowConfidenceSpans,
  onConfirm,
  onCancel,
}: FrictionGateProps) {
  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => !nextOpen && onCancel()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-stone-950/40 backdrop-blur-sm transition-opacity" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,600px)] -translate-x-1/2 -translate-y-1/2 rounded-[2.5rem] bg-white p-8 border border-stone-200/60 shadow-2xl transition-all">
          <Dialog.Title className="text-2xl font-bold text-stone-950 tracking-tight">
            Redaction Quality Warning
          </Dialog.Title>
          <Dialog.Description className="mt-2.5 text-sm leading-relaxed text-stone-550">
            There are low-confidence or potentially missed sensitive items that have not been audited. Exporting now may risk leaking private credentials or identifiers.
          </Dialog.Description>

          <div className="mt-6 space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
            {pendingLowConfidenceSpans.slice(0, 5).map((span) => (
              <div
                key={span.id}
                className="rounded-2xl border border-stone-150 bg-stone-50/50 px-4 py-3 flex items-center justify-between gap-3"
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
              </div>
            ))}
          </div>

          <div className="mt-8 flex flex-wrap justify-end gap-3 border-t border-stone-100 pt-5">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-stone-300 px-5 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
            >
              Go back and review
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-full bg-rose-600 px-5 py-2 text-xs font-semibold text-white transition hover:bg-rose-700"
            >
              Export anyway
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
