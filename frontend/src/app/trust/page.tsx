"use client";

import { useState } from "react";

import { ActionBar } from "@/components/shared/ActionBar";
import { AuditPanel } from "@/components/shared/AuditPanel";
import { DocumentViewer } from "@/components/shared/DocumentViewer";
import { ExportButton } from "@/components/shared/ExportButton";
import { analyzeDocument } from "@/lib/api";
import { useDocumentStore } from "@/store/documentStore";

const DEFAULT_TEXT = `Patient intake summary

Dr. Sarah Chen reviewed the referral before forwarding it to Stanford for specialist triage.
For follow-up, contact s.chen@hospital.org or call (415) 555-0194.
Legacy records still list SSN 482-73-1920 on the intake cover sheet.`;

export default function TrustPage() {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [filename, setFilename] = useState("trust-sample.txt");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sessionId = useDocumentStore((state) => state.sessionId);
  const spans = useDocumentStore((state) => state.spans);
  const decisions = useDocumentStore((state) => state.decisions);
  const activeSpanId = useDocumentStore((state) => state.activeSpanId);
  const actionHistory = useDocumentStore((state) => state.actionHistory);
  const loadAnalysis = useDocumentStore((state) => state.loadAnalysis);
  const setActiveSpan = useDocumentStore((state) => state.setActiveSpan);
  const recordDecision = useDocumentStore((state) => state.recordDecision);
  const undoLastDecision = useDocumentStore((state) => state.undoLastDecision);
  const getActiveSpan = useDocumentStore((state) => state.getActiveSpan);
  const getVisibleSpans = useDocumentStore((state) => state.getVisibleSpans);

  const activeSpan = getActiveSpan();
  const visibleSpans = getVisibleSpans();

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
        <section className="rounded-[2rem] bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-700">
              Trust Mode / Marcus
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-stone-950">
              Integrated review-engine demo
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-stone-600">
              This page exercises the shared document review engine against the
              live analyze API. It is intentionally simple so we can validate
              trust-oriented review interactions before building the final mode
              experience.
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

              <ExportButton sessionId={sessionId} />
            </div>
          </div>

          {error ? (
            <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
        </section>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
          <div className="space-y-6">
            <ActionBar
              activeSpan={activeSpan}
              onAccept={(span) => recordDecision(span.id, "accept")}
              onReject={(span) => recordDecision(span.id, "reject")}
              onUndo={undoLastDecision}
              canUndo={actionHistory.length > 0}
            />

            <DocumentViewer
              text={text}
              spans={visibleSpans}
              activeSpanId={activeSpanId}
              onSpanClick={(span) => setActiveSpan(span.id)}
            />
          </div>

          <AuditPanel spans={spans} decisions={decisions} />
        </section>
      </div>
    </main>
  );
}
