import Link from "next/link";

const modeCards = [
  {
    href: "/trust",
    title: "Trust Review",
    description:
      "Inspect every detected item with confidence, reasoning, and audit history.",
    cta: "Open Trust Review",
  },
  {
    href: "/correction",
    title: "Correction Review",
    description:
      "Find missed sensitive data and fix incorrect redactions before export.",
    cta: "Open Correction Review",
  },
  {
    href: "/batch",
    title: "Batch Review",
    description:
      "Process multiple text documents through a fast review queue.",
    cta: "Open Batch Review",
  },
];

export default function Home() {
  return (
    <main className="px-6 py-16 sm:py-24">
      <div className="mx-auto flex max-w-6xl flex-col gap-16">
        <section className="relative overflow-hidden rounded-[2.5rem] border border-stone-850 bg-stone-950 px-8 py-16 text-stone-100 shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_120%,rgba(16,185,129,0.08),transparent_50%)]" />
          <div className="relative z-10 flex flex-col items-start gap-4">
            <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-400">
              Introducing Conseal
            </span>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl sm:leading-none text-white">
              AI-safe document review for sensitive information.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-stone-400 sm:text-lg">
              Detect, review, correct, and export redacted documents with transparent audit trails. Protect intellectual property and personal data before sharing with large language models.
            </p>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {modeCards.map((card) => (
            <div
              key={card.href}
              className="flex flex-col justify-between rounded-[2rem] border border-stone-200 bg-white p-8 shadow-sm hover:shadow-md transition-all duration-200"
            >
              <div>
                <h2 className="text-xl font-bold text-stone-900 tracking-tight">
                  {card.title}
                </h2>
                <p className="mt-4 text-sm leading-relaxed text-stone-600">
                  {card.description}
                </p>
              </div>
              <div className="mt-8">
                <Link
                  href={card.href}
                  className="inline-flex w-full items-center justify-center rounded-full bg-stone-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 transition-colors"
                >
                  {card.cta}
                </Link>
              </div>
            </div>
          ))}
        </section>
      </div>
    </main>
  );
}
