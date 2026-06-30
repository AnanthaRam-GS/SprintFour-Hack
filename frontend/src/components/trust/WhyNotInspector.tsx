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
    <section className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
            Inspection
          </p>
          <h2 className="mt-2 text-lg font-bold text-stone-900">Why was this kept visible?</h2>
          <p className="mt-3 rounded-2xl bg-stone-50 border border-stone-100 px-4 py-3 text-sm italic leading-relaxed text-stone-800">
            &quot;{selectedText}&quot;
          </p>
          <p className="mt-4 text-xs leading-relaxed text-stone-500">
            No detector rule currently flagged this exact selection as PII. You can manually highlight and flag it as a Correction if it contains sensitive information.
          </p>
        </div>

        <button
          type="button"
          onClick={onClear}
          className="rounded-full border border-stone-300 px-4 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-950 transition hover:bg-stone-50"
        >
          Clear
        </button>
      </div>
    </section>
  );
}
