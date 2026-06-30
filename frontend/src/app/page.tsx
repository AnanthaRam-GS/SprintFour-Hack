import Link from "next/link";

const modeCards = [
  {
    href: "/trust",
    title: "Trust Mode",
    persona: "Marcus",
    description:
      "Explain why spans were flagged so an anxious reviewer can trust the redaction output.",
    emphasis: "Primary MVP mode",
  },
  {
    href: "/correction",
    title: "Correction Mode",
    persona: "Sam",
    description:
      "Surface false positives and missed PII so fast-moving reviewers do not overtrust the tool.",
    emphasis: "Primary MVP mode",
  },
  {
    href: "/batch",
    title: "Batch Mode",
    persona: "Maya",
    description:
      "Prepare the shared engine for high-volume review workflows and document throughput.",
    emphasis: "Secondary stretch mode",
  },
];

export default function Home() {
  return (
    <main className="px-6 py-14">
      <div className="mx-auto flex max-w-6xl flex-col gap-10">
        <section className="rounded-[2rem] bg-stone-950 px-8 py-12 text-stone-100 shadow-xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
            Conseal Hackathon
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-tight sm:text-5xl">
            A shared PII review engine for trust, correction, and eventual batch
            workflows.
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-8 text-stone-300">
            Trust Mode and Correction Mode are the primary MVP tracks. This app
            shell is set up to let us exercise the same review engine across all
            three personas.
          </p>
        </section>

        <section className="grid gap-5 lg:grid-cols-3">
          {modeCards.map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-[2rem] border border-stone-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-stone-300 hover:shadow-lg"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                {card.persona}
              </p>
              <h2 className="mt-3 text-2xl font-semibold text-stone-950">
                {card.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-stone-600">
                {card.description}
              </p>
              <p className="mt-5 text-sm font-medium text-emerald-700">
                {card.emphasis}
              </p>
              <p className="mt-6 text-sm font-semibold text-stone-900 transition group-hover:text-emerald-700">
                Open mode
              </p>
            </Link>
          ))}
        </section>
      </div>
    </main>
  );
}
