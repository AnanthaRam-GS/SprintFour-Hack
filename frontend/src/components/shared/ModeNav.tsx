"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  title: string;
  subtitle: string;
};

const navItems: NavItem[] = [
  {
    href: "/trust",
    title: "Trust Mode",
    subtitle: "Marcus",
  },
  {
    href: "/correction",
    title: "Correction Mode",
    subtitle: "Sam",
  },
  {
    href: "/batch",
    title: "Batch Mode",
    subtitle: "Maya / lightweight queue",
  },
];

export function ModeNav() {
  const pathname = usePathname();

  return (
    <nav className="border-b border-stone-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <Link
            href="/"
            className="text-sm font-semibold uppercase tracking-[0.3em] text-stone-500"
          >
            Conseal Hackathon
          </Link>
          <p className="mt-1 text-sm text-stone-600">
            Shared review engine for trust, correction, and lightweight batch
            review workflows.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-2xl border px-4 py-3 transition ${
                  isActive
                    ? "border-stone-900 bg-stone-900 text-white shadow-sm"
                    : "border-stone-200 bg-stone-50 text-stone-700 hover:border-stone-300 hover:bg-stone-100"
                }`}
              >
                <p className="text-sm font-semibold">{item.title}</p>
                <p
                  className={`mt-1 text-xs ${
                    isActive ? "text-stone-300" : "text-stone-500"
                  }`}
                >
                  Persona: {item.subtitle}
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
