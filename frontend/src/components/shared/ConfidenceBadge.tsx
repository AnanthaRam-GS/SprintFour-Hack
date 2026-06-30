type ConfidenceBadgeProps = {
  confidence: number;
};

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const percentage = Math.round(confidence * 100);

  let toneClasses =
    "border-emerald-200 bg-emerald-50 text-emerald-700 ring-emerald-100/50";
  if (confidence < 0.5) {
    toneClasses =
      "border-rose-200 bg-rose-50 text-rose-700 ring-rose-100/50";
  } else if (confidence < 0.8) {
    toneClasses =
      "border-amber-200 bg-amber-50 text-amber-700 ring-amber-100/50";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold tabular-nums ring-1 ring-inset ${toneClasses}`}
    >
      {percentage}%
    </span>
  );
}
