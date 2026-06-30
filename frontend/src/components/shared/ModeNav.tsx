"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  title: string;
};

const navItems: NavItem[] = [
  {
    href: "/trust",
    title: "Trust Review",
  },
  {
    href: "/correction",
    title: "Correction Review",
  },
  {
    href: "/batch",
    title: "Batch Review",
  },
];

export function ModeNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 border-b border-stone-200/80 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <Link
            href="/"
            className="flex items-center gap-2 group"
          >
            <span className="text-lg font-bold tracking-tight text-stone-950 group-hover:text-emerald-700 transition-colors">
              Conseal
            </span>
            <span className="rounded-full bg-stone-100/80 px-2 py-0.5 text-[11px] font-medium text-stone-600 border border-stone-200/50">
              AI Privacy Review
            </span>
          </Link>
          <p className="text-xs text-stone-500">
            Review sensitive information before sharing documents with AI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition-all duration-150 ${
                  isActive
                    ? "bg-stone-900 text-stone-50 shadow-sm"
                    : "text-stone-600 hover:bg-stone-100/85 hover:text-stone-950"
                }`}
              >
                {item.title}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
