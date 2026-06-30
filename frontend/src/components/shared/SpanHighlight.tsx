import type { MouseEvent, ReactNode } from "react";

import { getSpanTypeLabel } from "@/lib/spanUtils";
import type { Span } from "@/types";

type SpanHighlightProps = {
  span: Span;
  children: ReactNode;
  isActive?: boolean;
  onClick?: (span: Span) => void;
};

function getSpanClasses(span: Span, isActive: boolean): string {
  let classes =
    "rounded-md border-b-2 px-0.5 transition-colors duration-150 ease-out";

  if (span.potentially_missed) {
    classes +=
      " border-rose-500 bg-rose-100/90 text-rose-950 decoration-rose-500";
  } else if (span.decision === "accept") {
    classes +=
      " border-emerald-500 bg-emerald-100/90 text-emerald-950 decoration-emerald-500";
  } else if (span.decision === "reject") {
    classes +=
      " border-stone-400 bg-stone-200/80 text-stone-500 line-through decoration-stone-500";
  } else if (span.decision === "add") {
    classes +=
      " border-violet-500 bg-violet-100/90 text-violet-950 decoration-violet-500";
  } else if (span.confidence < 0.5) {
    classes +=
      " border-amber-500 bg-amber-100/90 text-amber-950 decoration-amber-500";
  } else {
    classes +=
      " border-sky-500 bg-sky-100/90 text-sky-950 decoration-sky-500";
  }

  if (isActive) {
    classes += " ring-2 ring-stone-950/80 ring-offset-1";
  }

  return classes;
}

export function SpanHighlight({
  span,
  children,
  isActive = false,
  onClick,
}: SpanHighlightProps) {
  const title = `${getSpanTypeLabel(span.type)} • ${Math.round(span.confidence * 100)}%\n${span.explanation}`;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onClick?.(span);
  };

  return (
    <button
      type="button"
      title={title}
      data-span-id={span.id}
      data-start={span.start}
      data-end={span.end}
      onClick={handleClick}
      className={getSpanClasses(span, isActive)}
    >
      {children}
    </button>
  );
}
