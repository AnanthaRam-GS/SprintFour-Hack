type ThresholdSliderProps = {
  threshold: number;
  onChange: (value: number) => void;
};

export function ThresholdSlider({
  threshold,
  onChange,
}: ThresholdSliderProps) {
  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
              Confidence threshold
            </p>
            <p className="mt-1 text-sm text-stone-600">
              Higher thresholds hide lower-confidence detections from the main
              view but keep potentially missed PII visible.
            </p>
          </div>
          <span className="rounded-full bg-stone-950 px-3 py-1 text-sm font-semibold text-white">
            {threshold}%
          </span>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          value={threshold}
          onChange={(event) => onChange(Number(event.target.value))}
          className="w-full accent-emerald-600"
        />
      </div>
    </section>
  );
}
