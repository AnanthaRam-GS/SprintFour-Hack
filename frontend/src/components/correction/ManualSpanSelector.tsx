import { useState } from "react";

import type { SpanType } from "@/types";

type ManualSpanSelectorProps = {
  selectedText: string;
  onAddSpan: (spanType: SpanType) => void;
  onClear: () => void;
};

const selectableTypes: SpanType[] = [
  "NAME",
  "EMAIL",
  "PHONE",
  "ADDRESS",
  "DATE_OF_BIRTH",
  "ID_NUMBER",
  "OTHER",
];

export function ManualSpanSelector({
  selectedText,
  onAddSpan,
  onClear,
}: ManualSpanSelectorProps) {
  const [selectedType, setSelectedType] = useState<SpanType>("NAME");

  if (!selectedText) {
    return (
      <section className="rounded-[2rem] border border-dashed border-stone-200 bg-stone-50/50 p-6 text-sm text-stone-500 text-center leading-relaxed">
        Highlight document text to select and manually flag missed PII.
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
            Manual Correction Tool
          </p>
          <p className="mt-3 rounded-2xl bg-stone-50 border border-stone-100 px-4 py-3 text-sm italic leading-relaxed text-stone-800">
            &quot;{selectedText}&quot;
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold text-stone-500 uppercase tracking-[0.05em]">Assign PII Type</span>
          <select
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value as SpanType)}
            className="rounded-full border border-stone-300 bg-stone-50 px-4 py-2.5 text-xs text-stone-900 outline-none transition focus:border-emerald-500 focus:bg-white cursor-pointer"
          >
            {selectableTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-stone-100">
          <button
            type="button"
            onClick={() => onAddSpan(selectedType)}
            className="rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-stone-800"
          >
            Flag selected text
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border border-stone-300 px-4 py-2 text-xs font-semibold text-stone-700 transition hover:bg-stone-50"
          >
            Clear selection
          </button>
        </div>
      </div>
    </section>
  );
}
