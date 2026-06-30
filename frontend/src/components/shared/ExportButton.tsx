import { getExportUrl } from "@/lib/api";

type ExportButtonProps = {
  sessionId: string | null;
  disabled?: boolean;
  label?: string;
};

export function ExportButton({
  sessionId,
  disabled = false,
  label = "Export redacted document",
}: ExportButtonProps) {
  const isDisabled = !sessionId || disabled;

  const handleClick = () => {
    if (isDisabled) {
      return;
    }
    window.location.href = getExportUrl(sessionId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isDisabled}
      className="rounded-full bg-stone-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-100 disabled:text-stone-400 border border-stone-200"
    >
      {label}
    </button>
  );
}
