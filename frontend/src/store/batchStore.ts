import { create } from "zustand";

import type { AnalysisResult, AppDocument, Span } from "@/types";

export type BatchReviewJobStatus =
  | "queued"
  | "processing"
  | "needs_review"
  | "approved"
  | "rejected"
  | "failed";

export type BatchReviewJob = {
  jobId: string;
  filename: string;
  status: BatchReviewJobStatus;
  sessionId?: string | null;
  document?: AppDocument | null;
  spans?: Span[];
  error?: string | null;
  processedAt?: string | null;
};

type BatchCounts = {
  total: number;
  queued: number;
  processing: number;
  needsReview: number;
  approved: number;
  rejected: number;
  failed: number;
};

type BatchThroughput = {
  completed: number;
  filesPerHour: number | null;
};

type BatchState = {
  jobs: BatchReviewJob[];
  activeJobId: string | null;
  startedAt: string | null;
  startBatch: (files: { jobId: string; filename: string }[]) => void;
  setJobProcessing: (jobId: string) => void;
  setJobResult: (jobId: string, result: AnalysisResult) => void;
  setJobFailed: (jobId: string, error: string) => void;
  setActiveJob: (jobId: string | null) => void;
  markApproved: (jobId: string) => void;
  markRejected: (jobId: string) => void;
  resetBatch: () => void;
  getActiveJob: () => BatchReviewJob | null;
  getCounts: () => BatchCounts;
  getThroughput: () => BatchThroughput;
};

export type { BatchCounts, BatchThroughput };

const initialState = {
  jobs: [],
  activeJobId: null,
  startedAt: null,
} satisfies Pick<BatchState, "jobs" | "activeJobId" | "startedAt">;

function updateJob(
  jobs: BatchReviewJob[],
  jobId: string,
  updater: (job: BatchReviewJob) => BatchReviewJob,
) {
  return jobs.map((job) => (job.jobId === jobId ? updater(job) : job));
}

export const useBatchStore = create<BatchState>((set, get) => ({
  ...initialState,

  startBatch: (files) => {
    const jobs = files.map<BatchReviewJob>((file) => ({
      jobId: file.jobId,
      filename: file.filename,
      status: "queued",
      sessionId: null,
      document: null,
      spans: [],
      error: null,
      processedAt: null,
    }));

    set({
      jobs,
      activeJobId: jobs[0]?.jobId ?? null,
      startedAt: new Date().toISOString(),
    });
  },

  setJobProcessing: (jobId) => {
    set((state) => ({
      jobs: updateJob(state.jobs, jobId, (job) => ({
        ...job,
        status: "processing",
        error: null,
      })),
    }));
  },

  setJobResult: (jobId, result) => {
    set((state) => ({
      jobs: updateJob(state.jobs, jobId, (job) => ({
        ...job,
        status: "needs_review",
        sessionId: result.session_id,
        document: result.document,
        spans: result.spans.map((span) => ({ ...span })),
        error: null,
        processedAt: new Date().toISOString(),
      })),
    }));
  },

  setJobFailed: (jobId, error) => {
    set((state) => ({
      jobs: updateJob(state.jobs, jobId, (job) => ({
        ...job,
        status: "failed",
        error,
        processedAt: new Date().toISOString(),
      })),
    }));
  },

  setActiveJob: (jobId) => {
    set({ activeJobId: jobId });
  },

  markApproved: (jobId) => {
    set((state) => ({
      jobs: updateJob(state.jobs, jobId, (job) => ({
        ...job,
        status: "approved",
      })),
    }));
  },

  markRejected: (jobId) => {
    set((state) => ({
      jobs: updateJob(state.jobs, jobId, (job) => ({
        ...job,
        status: "rejected",
      })),
    }));
  },

  resetBatch: () => {
    set({ ...initialState });
  },

  getActiveJob: () => {
    const { jobs, activeJobId } = get();
    if (!activeJobId) {
      return null;
    }
    return jobs.find((job) => job.jobId === activeJobId) ?? null;
  },

  getCounts: () => {
    const jobs = get().jobs;

    return jobs.reduce<BatchCounts>(
      (counts, job) => {
        counts.total += 1;

        if (job.status === "needs_review") {
          counts.needsReview += 1;
        } else {
          counts[job.status] += 1;
        }

        return counts;
      },
      {
        total: 0,
        queued: 0,
        processing: 0,
        needsReview: 0,
        approved: 0,
        rejected: 0,
        failed: 0,
      },
    );
  },

  getThroughput: () => {
    const { jobs, startedAt } = get();
    const completed = jobs.filter((job) =>
      ["approved", "rejected", "failed"].includes(job.status),
    ).length;

    if (!startedAt || completed === 0) {
      return {
        completed,
        filesPerHour: null,
      };
    }

    const startedMs = new Date(startedAt).getTime();
    const elapsedMs = Date.now() - startedMs;

    if (elapsedMs <= 0) {
      return {
        completed,
        filesPerHour: null,
      };
    }

    return {
      completed,
      filesPerHour: Number(((completed / elapsedMs) * 3_600_000).toFixed(1)),
    };
  },
}));
