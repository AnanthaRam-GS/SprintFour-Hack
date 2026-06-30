"use client";

import { useMemo, useState } from "react";

import { ActionBar } from "@/components/shared/ActionBar";
import { AuditPanel } from "@/components/shared/AuditPanel";
import { DocumentViewer } from "@/components/shared/DocumentViewer";
import { MissedPIIBanner } from "@/components/correction/MissedPIIBanner";
import { TwoLaneQueue } from "@/components/correction/TwoLaneQueue";
import { ManualSpanSelector } from "@/components/correction/ManualSpanSelector";
import { FrictionGate } from "@/components/correction/FrictionGate";
import {
  analyzeDocument,
  getExportUrl,
  recordReviewDecision,
} from "@/lib/api";
import { useDocumentStore } from "@/store/documentStore";
import type { Span, SpanType } from "@/types";

const DEFAULT_TEXT = `Correction review memo

Patient Zero was mentioned in the incident summary, but the team treated it as a project codename rather than a legal identity.
The draft also noted December 14 as the date the sample freezer was reopened, which may not be a birth date at all.
During a rushed review, the desk line 555-0147 stayed visible in a sidebar note.
Another paragraph still references James Whitfield as the billing contact for the disputed transfer.
Sam needs to catch both harmless false positives and the sensitive details that may have slipped through.`;

type SelectedRange = {
  text: string;
  start: number;
  end: number;
};

export default function CorrectionPage() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [filename, setFilename] = useState("correction-sample.txt");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bannerAcknowledged, setBannerAcknowledged] = useState(false);
  const [selectedRange, setSelectedRange] = useState<SelectedRange | null>(null);
  const [firstActionTime, setFirstActionTime] = useState<number | null>(null);
  const [gateOpen, setGateOpen] = useState(false);

  const sessionId = useDocumentStore((state) => state.sessionId);
  const spans = useDocumentStore((state) => state.spans);
  const decisions = useDocumentStore((state) => state.decisions);
  const activeSpanId = useDocumentStore((state) => state.activeSpanId);
  const actionHistory = useDocumentStore((state) => state.actionHistory);
  const loadAnalysis = useDocumentStore((state) => state.loadAnalysis);
  const setActiveSpan = useDocumentStore((state) => state.setActiveSpan);
  const recordDecision = useDocumentStore((state) => state.recordDecision);
  const addManualSpan = useDocumentStore((state) => state.addManualSpan);
  const undoLastDecision = useDocumentStore((state) => state.undoLastDecision);
  const getActiveSpan = useDocumentStore((state) => state.getActiveSpan);
  const getVisibleSpans = useDocumentStore((state) => state.getVisibleSpans);

  const activeSpan = getActiveSpan();
  const visibleSpans = getVisibleSpans();
  const missedSpans = spans.filter((span) => span.potentially_missed);

  const pendingRiskySpans = useMemo(
    () =>
      spans.filter(
        (span) =>
          (!span.decision && span.confidence < 0.75) ||
          (!span.decision && span.potentially_missed),
      ),
    [spans],
  );

  const markFirstAction = () => {
    setFirstActionTime((current) => current ?? Date.now());
  };

  const clearSelection = () => {
    setSelectedRange(null);
    window.getSelection()?.removeAllRanges();
  };

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await analyzeDocument({
        text,
        filename,
        mode: "correction",
      });
      loadAnalysis(result);
      setBannerAcknowledged(false);
      setSelectedRange(null);
      setFirstActionTime(null);
      setGateOpen(false);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Analyze request failed.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDecision = async (span: Span, action: "accept" | "reject") => {
    if (!sessionId) {
      setError("No active backend session is available for this review.");
      return;
    }

    setError(null);
    markFirstAction();
    recordDecision(span.id, action);

    try {
      await recordReviewDecision({
        session_id: sessionId,
        span_id: span.id,
        action,
      });
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Decision request failed.",
      );
    }
  };

  const handleDocumentMouseUp = () => {
    const selection = window.getSelection();
    const nextSelectedText = selection?.toString().trim() ?? "";

    if (!nextSelectedText || nextSelectedText.length > 80) {
      setSelectedRange(null);
      return;
    }

    const start = text.indexOf(nextSelectedText);
    if (start === -1) {
      setSelectedRange(null);
      return;
    }

    setSelectedRange({
      text: nextSelectedText,
      start,
      end: start + nextSelectedText.length,
    });
  };

  const handleManualAdd = async (spanType: SpanType) => {
    if (!sessionId || !selectedRange) {
      setError("Select visible text before manually flagging it.");
      return;
    }

    setError(null);
    markFirstAction();

    const span: Span = {
      id: crypto.randomUUID(),
      start: selectedRange.start,
      end: selectedRange.end,
      text: selectedRange.text,
      type: spanType,
      confidence: 1,
      explanation: "Manually flagged by reviewer as sensitive information.",
      pattern_matched: "Manual reviewer selection",
      is_suggested: false,
      potentially_missed: true,
      decision: "add",
    };

    addManualSpan(span);

    try {
      await recordReviewDecision({
        session_id: sessionId,
        span_id: span.id,
        action: "add",
        new_span: span,
      });
      clearSelection();
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Manual add request failed.",
      );
    }
  };

  const triggerExport = () => {
    if (!sessionId) {
      setError("Analyze and review a document before exporting.");
      return;
    }

    window.location.href = getExportUrl(sessionId);
  };

  const handleReviewExport = () => {
    if (!sessionId) {
      setError("Analyze and review a document before exporting.");
      return;
    }

    const isFastExport =
      firstActionTime !== null && Date.now() - firstActionTime < 8000;

    if (isFastExport && pendingRiskySpans.length > 0) {
      setGateOpen(true);
      return;
    }

    triggerExport();
  };

  return (
    <main className="px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
              Correction Mode / Sam
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
              Correction Review
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-stone-600">
              For Sam: catch false positives and missed PII before exporting.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_240px]">
            <label className="flex flex-col gap-2 text-sm font-medium text-stone-700">
              Document text
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                className="min-h-[260px] rounded-3xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm leading-7 text-stone-900 outline-none transition focus:border-amber-500 focus:bg-white"
              />
            </label>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm font-medium text-stone-700">
                Filename
                <input
                  value={filename}
                  onChange={(event) => setFilename(event.target.value)}
                  className="rounded-full border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-amber-500 focus:bg-white"
                />
              </label>

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isLoading}
                className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-400"
              >
                {isLoading ? "Analyzing..." : "Analyze document"}
              </button>
            </div>
          </div>

          {error ? (
            <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
        </section>

        <MissedPIIBanner
          missedSpans={missedSpans}
          acknowledged={bannerAcknowledged}
          onAcknowledge={() => setBannerAcknowledged(true)}
          onSelectSpan={(span) => setActiveSpan(span.id)}
        />

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
          <div className="space-y-6">
            <div onMouseUp={handleDocumentMouseUp}>
              <DocumentViewer
                text={text}
                spans={visibleSpans}
                activeSpanId={activeSpanId}
                onSpanClick={(span) => setActiveSpan(span.id)}
              />
            </div>

            <ManualSpanSelector
              selectedText={selectedRange?.text ?? ""}
              onAddSpan={(spanType) => {
                void handleManualAdd(spanType);
              }}
              onClear={clearSelection}
            />
          </div>

          <div className="space-y-6">
            <TwoLaneQueue
              spans={spans}
              activeSpanId={activeSpanId}
              onSelectSpan={(span) => setActiveSpan(span.id)}
              onAccept={(span) => {
                void handleDecision(span, "accept");
              }}
              onReject={(span) => {
                void handleDecision(span, "reject");
              }}
            />

            <ActionBar
              activeSpan={activeSpan}
              onAccept={(span) => {
                void handleDecision(span, "accept");
              }}
              onReject={(span) => {
                void handleDecision(span, "reject");
              }}
              // Undo is local-only in the MVP until backend audit reversal is implemented.
              onUndo={undoLastDecision}
              canUndo={actionHistory.length > 0}
            />

            <AuditPanel spans={spans} decisions={decisions} />

            <div className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Export
              </p>
              <p className="mt-2 text-sm leading-7 text-stone-600">
                Run a final review pass before exporting the corrected document
                and audit bundle.
              </p>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={handleReviewExport}
                  disabled={!sessionId}
                  className="rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-300 disabled:text-stone-500"
                >
                  Review &amp; Export
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      <FrictionGate
        open={gateOpen}
        pendingLowConfidenceSpans={pendingRiskySpans}
        onCancel={() => setGateOpen(false)}
        onConfirm={() => {
          setGateOpen(false);
          triggerExport();
        }}
      />
    </main>
  );
}
