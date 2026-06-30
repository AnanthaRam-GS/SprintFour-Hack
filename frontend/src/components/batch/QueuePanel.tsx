import type { BatchReviewJob } from "@/store/batchStore";

type QueuePanelProps = {
  jobs: BatchReviewJob[];
  activeJobId: string | null;
  onSelectJob: (jobId: string) => void;
};

const statusStyles: Record<BatchReviewJob["status"], string> = {
  queued: "bg-stone-100 text-stone-700",
  processing: "bg-amber-100 text-amber-800",
  needs_review: "bg-sky-100 text-sky-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-800",
  failed: "bg-red-100 text-red-800",
};

export function QueuePanel({
  jobs,
  activeJobId,
  onSelectJob,
}: QueuePanelProps) {
  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
            Queue
          </p>
          <h2 className="mt-2 text-xl font-semibold text-stone-950">
            Batch review jobs
          </h2>
        </div>
        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-medium text-stone-600">
          {jobs.length} files
        </span>
      </div>

      {jobs.length === 0 ? (
        <p className="mt-5 rounded-2xl border border-dashed border-stone-200 bg-stone-50/50 px-4 py-6 text-xs text-stone-450 text-center leading-relaxed">
          No batch jobs queued. Upload plain text files to begin.
        </p>
      ) : (
        <div className="mt-5 space-y-3">
          {jobs.map((job) => {
            const isActive = job.jobId === activeJobId;
            const spanCount = job.spans?.length ?? 0;

            return (
              <button
                key={job.jobId}
                type="button"
                onClick={() => onSelectJob(job.jobId)}
                className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                  isActive
                    ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                    : "border-stone-200 bg-stone-50 text-stone-800 hover:border-stone-300 hover:bg-white"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {job.filename}
                    </p>
                    {job.error ? (
                      <p
                        className={`mt-2 text-xs ${
                          isActive ? "text-rose-200" : "text-rose-700"
                        }`}
                      >
                        {job.error}
                      </p>
                    ) : (
                      <p
                        className={`mt-2 text-xs ${
                          isActive ? "text-stone-300" : "text-stone-500"
                        }`}
                      >
                        {spanCount > 0
                          ? `${spanCount} spans detected`
                          : "No spans recorded yet"}
                      </p>
                    )}
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium ${
                      isActive ? "bg-white/15 text-white" : statusStyles[job.status]
                    }`}
                  >
                    {job.status.replace("_", " ")}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
