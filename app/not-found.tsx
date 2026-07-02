import Link from "next/link";
import { Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center justify-center px-4 py-24 text-center sm:py-32">
      <p className="eyebrow mb-3">error 404</p>
      <h1 className="text-3xl font-semibold sm:text-4xl">Page not found</h1>
      <p className="mt-2 text-[var(--color-muted)]">
        This page doesn&apos;t exist or may have moved.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[#0a1120] transition-transform hover:-translate-y-0.5"
      >
        <Home className="h-4 w-4" />
        Back home
      </Link>
    </div>
  );
}
