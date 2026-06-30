type ConfidenceBadgeProps = {
  confidence: number;
};

export function ConfidenceBadge({ confidence }: ConfidenceBadgeProps) {
  const percentage = Math.round(confidence * 100);

  let toneClasses =
    "border-emerald-300/60 bg-emerald-100 text-emerald-900 ring-emerald-200";
  if (confidence < 0.5) {
    toneClasses =
      "border-amber-300/70 bg-amber-100 text-amber-900 ring-amber-200";
  } else if (confidence < 0.8) {
    toneClasses =
      "border-sky-300/70 bg-sky-100 text-sky-900 ring-sky-200";
  }

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold tabular-nums ring-1 ring-inset ${toneClasses}`}
    >
      {percentage}%
    </span>
  );
}
