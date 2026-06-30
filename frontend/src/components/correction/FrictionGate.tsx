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
        <Dialog.Overlay className="fixed inset-0 z-40 bg-stone-950/50 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,640px)] -translate-x-1/2 -translate-y-1/2 rounded-[2rem] bg-white p-6 shadow-2xl">
          <Dialog.Title className="text-2xl font-semibold text-stone-950">
            Review may be too fast
          </Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-7 text-stone-600">
            There are still low-confidence or missed items that have not been
            reviewed.
          </Dialog.Description>

          <div className="mt-5 space-y-3">
            {pendingLowConfidenceSpans.slice(0, 5).map((span) => (
              <div
                key={span.id}
                className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-stone-900">
                      &quot;{span.text}&quot;
                    </p>
                    <p className="mt-1 text-xs text-stone-600">
                      {getSpanTypeLabel(span.type)}
                    </p>
                  </div>
                  <ConfidenceBadge confidence={span.confidence} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
            >
              Go back and review
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
            >
              Export anyway
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
