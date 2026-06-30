"use client";

import { useEffect, useMemo, useState } from "react";

import { useHotkeys } from "react-hotkeys-hook";

import { DropZone } from "@/components/batch/DropZone";
import { QueuePanel } from "@/components/batch/QueuePanel";
import { ThroughputBadge } from "@/components/batch/ThroughputBadge";
import { ActionBar } from "@/components/shared/ActionBar";
import { AuditPanel } from "@/components/shared/AuditPanel";
import { DocumentViewer } from "@/components/shared/DocumentViewer";
import { ExportButton } from "@/components/shared/ExportButton";
import { analyzeDocument, recordReviewDecision } from "@/lib/api";
import {
  type BatchReviewJob,
  useBatchStore,
} from "@/store/batchStore";
import { useDocumentStore } from "@/store/documentStore";
import type { AnalysisResult, Span } from "@/types";

function createAnalysisResult(job: BatchReviewJob): AnalysisResult | null {
  if (!job.sessionId || !job.document || !job.spans) {
    return null;
  }

  return {
    session_id: job.sessionId,
    document: job.document,
    spans: job.spans,
    mode: "batch",
  };
}

export default function BatchPage() {
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const jobs = useBatchStore((state) => state.jobs);
  const activeJobId = useBatchStore((state) => state.activeJobId);
  const startBatch = useBatchStore((state) => state.startBatch);
  const setJobProcessing = useBatchStore((state) => state.setJobProcessing);
  const setJobResult = useBatchStore((state) => state.setJobResult);
  const setJobFailed = useBatchStore((state) => state.setJobFailed);
  const setActiveJob = useBatchStore((state) => state.setActiveJob);
  const syncJobSpans = useBatchStore((state) => state.syncJobSpans);
  const markApproved = useBatchStore((state) => state.markApproved);
  const markRejected = useBatchStore((state) => state.markRejected);
  const getActiveJob = useBatchStore((state) => state.getActiveJob);
  const getCounts = useBatchStore((state) => state.getCounts);
  const getThroughput = useBatchStore((state) => state.getThroughput);

  const sessionId = useDocumentStore((state) => state.sessionId);
  const spans = useDocumentStore((state) => state.spans);
  const decisions = useDocumentStore((state) => state.decisions);
  const activeSpanId = useDocumentStore((state) => state.activeSpanId);
  const actionHistory = useDocumentStore((state) => state.actionHistory);
  const loadAnalysis = useDocumentStore((state) => state.loadAnalysis);
  const setActiveSpan = useDocumentStore((state) => state.setActiveSpan);
  const recordDecision = useDocumentStore((state) => state.recordDecision);
  const undoLastDecision = useDocumentStore((state) => state.undoLastDecision);
  const resetReview = useDocumentStore((state) => state.resetReview);
  const getActiveSpan = useDocumentStore((state) => state.getActiveSpan);

  const activeJob = getActiveJob();
  const activeSpan = getActiveSpan();
  const counts = getCounts();
  const throughput = getThroughput();

  const activeJobIndex = useMemo(
    () => jobs.findIndex((job) => job.jobId === activeJobId),
    [activeJobId, jobs],
  );

  useEffect(() => {
    if (!activeJob) {
      resetReview();
      return;
    }

    const result = createAnalysisResult(activeJob);
    if (!result) {
      resetReview();
      return;
    }

    loadAnalysis(result);
  }, [activeJob, loadAnalysis, resetReview]);

  useEffect(() => {
    if (!activeJobId) {
      return;
    }

    syncJobSpans(activeJobId, spans);
  }, [activeJobId, spans, syncJobSpans]);

  useHotkeys(
    "arrowdown",
    () => {
      if (jobs.length === 0) {
        return;
      }

      const nextIndex =
        activeJobIndex >= 0 && activeJobIndex < jobs.length - 1
          ? activeJobIndex + 1
          : activeJobIndex;
      const nextJob = jobs[nextIndex];
      if (nextJob) {
        setActiveJob(nextJob.jobId);
      }
    },
    {
      enableOnFormTags: true,
      preventDefault: true,
    },
    [jobs, activeJobIndex, setActiveJob],
  );

  useHotkeys(
    "arrowup",
    () => {
      if (jobs.length === 0) {
        return;
      }

      const nextIndex = activeJobIndex > 0 ? activeJobIndex - 1 : activeJobIndex;
      const nextJob = jobs[nextIndex];
      if (nextJob) {
        setActiveJob(nextJob.jobId);
      }
    },
    {
      enableOnFormTags: true,
      preventDefault: true,
    },
    [jobs, activeJobIndex, setActiveJob],
  );

  useHotkeys(
    "space",
    () => {
      if (activeJobId) {
        markApproved(activeJobId);
      }
    },
    {
      enableOnFormTags: true,
      preventDefault: true,
    },
    [activeJobId, markApproved],
  );

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) {
      return;
    }

    setIsUploading(true);
    setError(null);

    const jobsToStart = files.map((file) => ({
      jobId: crypto.randomUUID(),
      filename: file.name,
    }));

    startBatch(jobsToStart);

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const job = jobsToStart[index];
      if (!job || !file) {
        continue;
      }

      if (index === 0) {
        setActiveJob(job.jobId);
      }

      setJobProcessing(job.jobId);

      try {
        const text = await file.text();
        const result = await analyzeDocument({
          text,
          filename: file.name,
          mode: "batch",
        });

        setJobResult(job.jobId, result);

        const shouldAutoApprove =
          result.spans.length === 0 ||
          result.spans.every((span) => span.confidence >= 0.9);

        if (shouldAutoApprove) {
          markApproved(job.jobId);
        }
      } catch (caughtError) {
        const message =
          caughtError instanceof Error
            ? caughtError.message
            : "Batch analysis failed for this file.";
        setJobFailed(job.jobId, message);
      }
    }

    setIsUploading(false);
  };

  const handleSelectJob = (jobId: string) => {
    setError(null);
    setActiveJob(jobId);
  };

  const handleSpanDecision = async (span: Span, action: "accept" | "reject") => {
    if (!sessionId || !activeJobId) {
      setError("Select a processed file before recording a review decision.");
      return;
    }

    setError(null);
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

  return (
    <main className="px-6 py-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-8">
        <section className="rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sky-700">
              Batch Review
            </p>
            <h1 className="text-3xl font-bold tracking-tight text-stone-950">
              Batch Review
            </h1>
            <p className="max-w-3xl text-sm leading-7 text-stone-600">
              Review multiple documents quickly with a lightweight high-volume queue. Batch Mode uses frontend-driven processing for this MVP. Individual reviewed exports are available.
            </p>
          </div>

          <div className="mt-8">
            <DropZone onFilesSelected={(files) => void handleFilesSelected(files)} disabled={isUploading} />
          </div>

          <p className="mt-4 text-xs text-stone-400">
            Upload a few .txt files to simulate the high-volume review queue.
          </p>

          {error ? (
            <p className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </p>
          ) : null}
        </section>

        <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="space-y-6">
            <QueuePanel
              jobs={jobs}
              activeJobId={activeJobId}
              onSelectJob={handleSelectJob}
            />
            <ThroughputBadge counts={counts} throughput={throughput} />
            <div className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Shortcuts
              </p>
              <div className="mt-3 space-y-2 text-sm text-stone-600">
                <p>
                  <span className="font-semibold text-stone-900">Arrow Up</span>{" "}
                  previous file
                </p>
                <p>
                  <span className="font-semibold text-stone-900">
                    Arrow Down
                  </span>{" "}
                  next file
                </p>
                <p>
                  <span className="font-semibold text-stone-900">Space</span>{" "}
                  approve active file
                </p>
              </div>
            </div>
          </aside>

          <section className="space-y-6">
            {activeJob?.document ? (
              <>
                <div className="rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                        Active file
                      </p>
                      <h2 className="mt-2 text-2xl font-semibold text-stone-950">
                        {activeJob.filename}
                      </h2>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        onClick={() => activeJobId && markApproved(activeJobId)}
                        disabled={!activeJobId}
                        className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-300"
                      >
                        Approve file
                      </button>
                      <button
                        type="button"
                        onClick={() => activeJobId && markRejected(activeJobId)}
                        disabled={!activeJobId}
                        className="rounded-full bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:bg-stone-400"
                      >
                        Reject file
                      </button>
                    </div>
                  </div>

                  <p className="mt-4 text-sm leading-7 text-stone-600">
                    Bulk ZIP export is intentionally left out of the 8-hour MVP;
                    individual reviewed exports are available.
                  </p>

                  <div className="mt-6">
                    <DocumentViewer
                      text={activeJob.document.text}
                      spans={spans}
                      activeSpanId={activeSpanId}
                      onSpanClick={(span) => setActiveSpan(span.id)}
                    />
                  </div>
                </div>

                <ActionBar
                  activeSpan={activeSpan}
                  onAccept={(span) => {
                    void handleSpanDecision(span, "accept");
                  }}
                  onReject={(span) => {
                    void handleSpanDecision(span, "reject");
                  }}
                  // Undo is local-only in the MVP until backend audit reversal is implemented.
                  onUndo={undoLastDecision}
                  canUndo={actionHistory.length > 0}
                />

                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                  <AuditPanel spans={spans} decisions={decisions} />
                  <div className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                      Export
                    </p>
                    <p className="mt-2 text-sm leading-7 text-stone-600">
                      Download the currently reviewed file with its audit log.
                    </p>
                    <div className="mt-4">
                      <ExportButton sessionId={activeJob.sessionId ?? null} />
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-[2rem] border border-dashed border-stone-250 bg-stone-50/50 px-6 py-12 text-center text-stone-550">
                <h2 className="text-xl font-bold text-stone-900">
                  No active review file yet
                </h2>
                <p className="mt-3 text-xs leading-relaxed text-stone-550 max-w-md mx-auto">
                  Upload a few .txt files to build the review queue, then select a file to inspect detected spans and approve redactions.
                </p>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
