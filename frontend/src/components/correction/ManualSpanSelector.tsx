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
      <section className="rounded-[2rem] border border-dashed border-stone-300 bg-stone-50 p-5 text-sm leading-7 text-stone-500">
        Select visible text in the document to manually flag missed PII.
      </section>
    );
  }

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            Manual flagging
          </p>
          <p className="mt-3 rounded-2xl bg-stone-100 px-4 py-3 text-sm italic leading-7 text-stone-800">
            &quot;{selectedText}&quot;
          </p>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium text-stone-700">
          PII type
          <select
            value={selectedType}
            onChange={(event) => setSelectedType(event.target.value as SpanType)}
            className="rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500 focus:bg-white"
          >
            {selectableTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </label>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => onAddSpan(selectedType)}
            className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800"
          >
            Flag selected text
          </button>
          <button
            type="button"
            onClick={onClear}
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
          >
            Clear
          </button>
        </div>
      </div>
    </section>
  );
}
