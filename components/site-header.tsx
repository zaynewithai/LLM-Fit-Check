import Link from "next/link";
import { Cpu } from "lucide-react";
import { NavLinks } from "./nav-links";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[color-mix(in_srgb,var(--color-bg)_82%,transparent)] backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="grid h-8 w-8 place-items-center rounded-md border border-[var(--color-line-strong)] bg-[var(--color-surface-2)] text-[var(--color-fast)]">
            <Cpu className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <span className="flex flex-col leading-none">
            <span className="font-[var(--font-display)] text-[0.95rem] font-semibold tracking-tight text-[var(--color-heading)]">
              LLMFitCheck
            </span>
            <span className="eyebrow mt-0.5 hidden sm:block">open-weight · memory calculator</span>
          </span>
        </Link>
        <NavLinks />
      </div>
    </header>
  );
}
