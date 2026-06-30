import { create } from "zustand";

import type {
  AnalysisResult,
  AppDocument,
  AppMode,
  Span,
  SpanAction,
} from "@/types";

type ActionHistoryEntry = {
  spanId: string;
  previousAction?: SpanAction | null;
  nextAction: SpanAction;
};

type DocumentReviewState = {
  sessionId: string | null;
  document: AppDocument | null;
  mode: AppMode | null;
  spans: Span[];
  activeSpanId: string | null;
  threshold: number;
  decisions: Record<string, SpanAction>;
  actionHistory: ActionHistoryEntry[];
  loadAnalysis: (result: AnalysisResult) => void;
  setActiveSpan: (spanId: string | null) => void;
  setThreshold: (threshold: number) => void;
  recordDecision: (spanId: string, action: SpanAction) => void;
  addManualSpan: (span: Span) => void;
  undoLastDecision: () => void;
  resetReview: () => void;
  getActiveSpan: () => Span | null;
  getVisibleSpans: () => Span[];
};

const initialState = {
  sessionId: null,
  document: null,
  mode: null,
  spans: [],
  activeSpanId: null,
  threshold: 0,
  decisions: {},
  actionHistory: [],
} satisfies Pick<
  DocumentReviewState,
  | "sessionId"
  | "document"
  | "mode"
  | "spans"
  | "activeSpanId"
  | "threshold"
  | "decisions"
  | "actionHistory"
>;

export const useDocumentStore = create<DocumentReviewState>((set, get) => ({
  ...initialState,

  loadAnalysis: (result) => {
    const spans = result.spans.map((span) => ({ ...span }));
    const decisions = spans.reduce<Record<string, SpanAction>>((acc, span) => {
      if (span.decision) {
        acc[span.id] = span.decision;
      }
      return acc;
    }, {});

    set({
      sessionId: result.session_id,
      document: result.document,
      mode: result.mode,
      spans,
      activeSpanId: null,
      threshold: 0,
      decisions,
      actionHistory: [],
    });
  },

  setActiveSpan: (spanId) => {
    set({ activeSpanId: spanId });
  },

  setThreshold: (threshold) => {
    const clampedThreshold = Math.min(100, Math.max(0, threshold));
    set({ threshold: clampedThreshold });
  },

  recordDecision: (spanId, action) => {
    const currentSpan = get().spans.find((span) => span.id === spanId);
    if (!currentSpan) {
      return;
    }

    const previousAction = currentSpan.decision ?? undefined;

    set((state) => ({
      decisions: {
        ...state.decisions,
        [spanId]: action,
      },
      spans: state.spans.map((span) =>
        span.id === spanId ? { ...span, decision: action } : span,
      ),
      actionHistory: [
        ...state.actionHistory,
        {
          spanId,
          previousAction,
          nextAction: action,
        },
      ],
    }));
  },

  addManualSpan: (span) => {
    const manualSpan: Span = {
      ...span,
      decision: "add",
    };

    set((state) => ({
      spans: [...state.spans, manualSpan],
      decisions: {
        ...state.decisions,
        [manualSpan.id]: "add",
      },
      actionHistory: [
        ...state.actionHistory,
        {
          spanId: manualSpan.id,
          previousAction: span.decision ?? undefined,
          nextAction: "add",
        },
      ],
    }));
  },

  undoLastDecision: () => {
    const lastAction = get().actionHistory.at(-1);
    if (!lastAction) {
      return;
    }

    set((state) => {
      const nextDecisions = { ...state.decisions };
      if (lastAction.previousAction == null) {
        delete nextDecisions[lastAction.spanId];
      } else {
        nextDecisions[lastAction.spanId] = lastAction.previousAction;
      }

      return {
        decisions: nextDecisions,
        spans: state.spans.map((span) =>
          span.id === lastAction.spanId
            ? {
                ...span,
                decision: lastAction.previousAction ?? null,
              }
            : span,
        ),
        actionHistory: state.actionHistory.slice(0, -1),
      };
    });
  },

  resetReview: () => {
    set({ ...initialState });
  },

  getActiveSpan: () => {
    const { activeSpanId, spans } = get();
    if (!activeSpanId) {
      return null;
    }
    return spans.find((span) => span.id === activeSpanId) ?? null;
  },

  getVisibleSpans: () => {
    const { spans, threshold } = get();
    return spans.filter(
      (span) => span.potentially_missed || span.confidence * 100 >= threshold,
    );
  },
}));
