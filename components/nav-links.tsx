"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", short: "Home", label: "Home" },
  { href: "/fit", short: "Fit", label: "Hardware → Models" },
  { href: "/model", short: "Model", label: "Model → Hardware" },
  { href: "/catalog", short: "Catalog", label: "Catalog" },
] as const;

export function NavLinks() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="flex items-center gap-0.5 sm:gap-1">
      {links.map((l) => {
        const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
        return (
          <Link
            key={l.href}
            href={l.href}
            aria-current={active ? "page" : undefined}
            title={l.label}
            className={[
              "rounded-md px-2 py-1.5 text-[0.8125rem] transition-colors sm:px-3",
              active
                ? "bg-[var(--color-accent-soft)] text-[var(--color-heading)]"
                : "text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface)]",
            ].join(" ")}
          >
            <span className="sm:hidden">{l.short}</span>
            <span className="hidden sm:inline">{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
