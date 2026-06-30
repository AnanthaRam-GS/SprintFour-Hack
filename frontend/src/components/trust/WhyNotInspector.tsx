type WhyNotInspectorProps = {
  selectedText: string;
  onClear: () => void;
};

export function WhyNotInspector({
  selectedText,
  onClear,
}: WhyNotInspectorProps) {
  if (!selectedText) {
    return null;
  }

  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            Why was this kept visible?
          </p>
          <p className="mt-3 rounded-2xl bg-stone-100 px-4 py-3 text-sm italic leading-7 text-stone-800">
            &quot;{selectedText}&quot;
          </p>
          <p className="mt-4 text-sm leading-7 text-stone-600">
            No detector rule currently marked this exact selection as PII.
            Reviewers can still manually flag it if it contains sensitive
            information.
          </p>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-700 transition hover:bg-stone-100"
        >
          Clear
        </button>
      </div>
    </section>
  );
}
