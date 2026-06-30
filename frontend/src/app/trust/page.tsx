"use client";

import { useState } from "react";

import { ActionBar } from "@/components/shared/ActionBar";
import { AuditPanel } from "@/components/shared/AuditPanel";
import { DocumentViewer } from "@/components/shared/DocumentViewer";
import { ExportButton } from "@/components/shared/ExportButton";
import { AuditSummaryHeader } from "@/components/trust/AuditSummaryHeader";
import { ExplanationPanel } from "@/components/trust/ExplanationPanel";
import { ThresholdSlider } from "@/components/trust/ThresholdSlider";
import { WhyNotInspector } from "@/components/trust/WhyNotInspector";
import { analyzeDocument, recordReviewDecision } from "@/lib/api";
import { useDocumentStore } from "@/store/documentStore";

const DEFAULT_TEXT = `Patient intake summary

Dr. Sarah Chen reviewed the referral before forwarding it to Stanford for specialist triage.

For follow-up, contact s.chen@hospital.org or call (415) 555-0194.

Legacy records still list SSN 482-73-1920 on the intake cover sheet.`;

export default function TrustPage() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [filename, setFilename] = useState("sensitive-intake-note.txt");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedText, setSelectedText] = useState("");

  const sessionId = useDocumentStore((state) => state.sessionId);
  const spans = useDocumentStore((state) => state.spans);
  const decisions = useDocumentStore((state) => state.decisions);
  const activeSpanId = useDocumentStore((state) => state.activeSpanId);
  const actionHistory = useDocumentStore((state) => state.actionHistory);
  const threshold = useDocumentStore((state) => state.threshold);
  const loadAnalysis = useDocumentStore((state) => state.loadAnalysis);
  const setActiveSpan = useDocumentStore((state) => state.setActiveSpan);
  const setThreshold = useDocumentStore((state) => state.setThreshold);
  const recordDecision = useDocumentStore((state) => state.recordDecision);
  const undoLastDecision = useDocumentStore((state) => state.undoLastDecision);
  const getActiveSpan = useDocumentStore((state) => state.getActiveSpan);
  const getVisibleSpans = useDocumentStore((state) => state.getVisibleSpans);

  const activeSpan = getActiveSpan();
  const visibleSpans = getVisibleSpans();

  const handleDocumentMouseUp = () => {
    const selection = window.getSelection();
    const nextSelectedText = selection?.toString().trim() ?? "";

    if (!nextSelectedText || nextSelectedText.length > 160) {
      setSelectedText("");
      return;
    }

    setSelectedText(nextSelectedText);
  };

  const handleDecision = async (spanId: string, action: "accept" | "reject") => {
    if (!sessionId) {
      setError("No active backend session is available for this review.");
      return;
    }

    setError(null);
    recordDecision(spanId, action);

    try {
      await recordReviewDecision({
        session_id: sessionId,
        span_id: spanId,
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

  const handleAnalyze = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await analyzeDocument({
        text,
        filename,
        mode: "trust",
      });
      loadAnalysis(result);
      setSelectedText("");
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

  return (
    <main className="px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Trust Review
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-stone-950">
              Trust Review
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-stone-600">
              Inspect every detected sensitive item with confidence scores, reasoning, and a complete review trail.
            </p>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_220px]">
            <label className="flex flex-col gap-2 text-sm font-medium text-stone-700">
              Document text
              <textarea
                value={text}
                onChange={(event) => setText(event.target.value)}
                className="min-h-[240px] rounded-3xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm leading-7 text-stone-900 outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </label>

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm font-medium text-stone-700">
                Filename
                <input
                  value={filename}
                  onChange={(event) => setFilename(event.target.value)}
                  className="rounded-full border border-stone-300 bg-stone-50 px-4 py-3 text-sm text-stone-900 outline-none transition focus:border-emerald-500 focus:bg-white"
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

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.85fr)]">
          <div className="space-y-6">
            <AuditSummaryHeader spans={spans} threshold={threshold} />
            <ThresholdSlider
              threshold={threshold}
              onChange={(value) => setThreshold(value)}
            />

            <div onMouseUp={handleDocumentMouseUp}>
              <DocumentViewer
                text={text}
                spans={visibleSpans}
                activeSpanId={activeSpanId}
                onSpanClick={(span) => setActiveSpan(span.id)}
              />
            </div>

            <WhyNotInspector
              selectedText={selectedText}
              onClear={() => setSelectedText("")}
            />
          </div>

          <div className="space-y-6">
            <ExplanationPanel activeSpan={activeSpan} />

            <ActionBar
              activeSpan={activeSpan}
              onAccept={(span) => {
                void handleDecision(span.id, "accept");
              }}
              onReject={(span) => {
                void handleDecision(span.id, "reject");
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
                Download the current redacted document and audit log bundle for
                final handoff.
              </p>
              <div className="mt-4">
                <ExportButton sessionId={sessionId} />
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
