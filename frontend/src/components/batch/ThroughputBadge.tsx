import type { BatchCounts, BatchThroughput } from "@/store/batchStore";

type ThroughputBadgeProps = {
  counts: BatchCounts;
  throughput: BatchThroughput;
};

export function ThroughputBadge({
  counts,
  throughput,
}: ThroughputBadgeProps) {
  return (
    <section className="rounded-[2rem] border border-stone-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
        Throughput
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl bg-stone-100 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
            Total files
          </p>
          <p className="mt-2 text-2xl font-semibold text-stone-950">
            {counts.total}
          </p>
        </div>

        <div className="rounded-2xl bg-stone-100 px-4 py-3">
          <p className="text-xs uppercase tracking-[0.2em] text-stone-500">
            Files / hour
          </p>
          <p className="mt-2 text-2xl font-semibold text-stone-950">
            {throughput.filesPerHour ?? "—"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-stone-700">
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-800">
          Approved: {counts.approved}
        </span>
        <span className="rounded-full bg-rose-100 px-3 py-1 text-rose-800">
          Rejected: {counts.rejected}
        </span>
        <span className="rounded-full bg-red-100 px-3 py-1 text-red-800">
          Failed: {counts.failed}
        </span>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-800">
          Completed: {throughput.completed}
        </span>
      </div>
    </section>
  );
}
