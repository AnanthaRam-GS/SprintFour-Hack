export default function Home() {
  return (
    <main className="min-h-screen bg-stone-950 px-6 py-16 text-stone-100">
      <div className="mx-auto flex max-w-4xl flex-col gap-10">
        <div className="space-y-4">
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-300">
            SprintFour Hackathon
          </p>
          <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-6xl">
            Conseal scaffold is ready for Problem 1 and Problem 3.
          </h1>
          <p className="max-w-2xl text-lg leading-8 text-stone-300">
            This Next.js 14 frontend is paired with a FastAPI backend for a
            deployable PII anonymization review MVP.
          </p>
        </div>

        <section className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-3xl border border-stone-800 bg-stone-900/80 p-6">
            <h2 className="text-lg font-medium text-stone-100">
              Frontend stack
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-300">
              Next.js 14, TypeScript, App Router, Tailwind CSS, Zustand, SWR,
              Radix UI, and keyboard shortcuts support.
            </p>
          </article>
          <article className="rounded-3xl border border-stone-800 bg-stone-900/80 p-6">
            <h2 className="text-lg font-medium text-stone-100">
              Backend stack
            </h2>
            <p className="mt-3 text-sm leading-6 text-stone-300">
              FastAPI with CORS configured for localhost development and a
              health endpoint ready for deployment checks.
            </p>
          </article>
        </section>
      </div>
    </main>
  );
}
