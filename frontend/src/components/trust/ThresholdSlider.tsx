type ThresholdSliderProps = {
  threshold: number;
  onChange: (value: number) => void;
};

export function ThresholdSlider({
  threshold,
  onChange,
}: ThresholdSliderProps) {
  return (
    <section className="rounded-[2rem] border border-stone-200/80 bg-white p-6 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
              Confidence threshold
            </p>
            <p className="mt-1 text-xs text-stone-500 leading-relaxed">
              Higher thresholds hide lower-confidence detections from the main
              view but keep potentially missed PII visible.
            </p>
          </div>
          <span className="rounded-full bg-stone-900 px-3 py-1 text-sm font-semibold text-white">
            {threshold}%
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          value={threshold}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full accent-emerald-600 cursor-pointer h-1 bg-stone-100 rounded-lg appearance-none"
        />
      </div>
    </section>
  );
}
