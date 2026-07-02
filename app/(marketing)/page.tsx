import Link from "next/link";
import { ArrowRight, MemoryStick, Microscope, RefreshCw } from "lucide-react";
import { config } from "@/lib/config";

export default function HomePage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      {/* hero */}
      <section className="pt-12 pb-10 sm:pt-20 sm:pb-16">
        <p className="eyebrow mb-4 flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-fast)] live-dot" />
          {config.appName}
        </p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.05] sm:text-6xl">
          Which open LLMs{" "}
          <span className="text-[var(--color-fast)]">fit your hardware?</span>
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-[var(--color-muted)]">
          A memory calculator for open-weight models. Tell us your memory and see every model you can
          run — or pick a model and get the exact hardware you need. No guesswork, no closed models.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/fit"
            className="group inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--color-accent)] px-5 py-3 text-sm font-semibold text-[#0a1120] transition-transform hover:-translate-y-0.5"
          >
            <MemoryStick className="h-4 w-4" />
            Hardware → Models
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <Link
            href="/model"
            className="group inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-5 py-3 text-sm font-semibold text-[var(--color-ink)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-heading)]"
          >
            <Microscope className="h-4 w-4" />
            Model → Hardware
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </section>

      {/* signature element preview */}
      <section className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">the memory budget bar</p>
            <p className="mt-1 text-sm text-[var(--color-muted)]">
              One bar per model. Full width is your memory; the fill is what the model needs.
            </p>
          </div>
          <Link href="/fit" className="hidden text-sm text-[var(--color-accent)] hover:underline sm:inline">
            try it →
          </Link>
        </div>

        <div className="mt-6 space-y-4">
          <SampleBar name="Llama 3.1 8B" family="Llama · dense" verdict="fast" fillPct={34} tag="Runs fast" />
          <SampleBar name="Qwen3 32B" family="Qwen · dense" verdict="offload" fillPct={78} tag="Runs offloaded" vramMark={52} />
          <SampleBar name="DeepSeek V3" family="DeepSeek · MoE" verdict="wontfit" fillPct={100} tag="Won't fit" vramMark={52} overflow />
        </div>
      </section>

      {/* feature row */}
      <section className="mt-10 grid gap-4 sm:grid-cols-3 sm:pb-16">
        <Feature
          title="Two calculators"
          body="Hardware → Models lists everything you can run. Model → Hardware recommends concrete GPUs or a Mac."
        />
        <Feature
          title="Honest numbers"
          body="Weights are exact per quantization. KV cache is an estimate — we say so up front, never fudge it."
        />
        <Feature
          title="Self-updating"
          body="The catalog syncs parameter counts from Hugging Face automatically. It never goes stale."
          icon={<RefreshCw className="h-3.5 w-3.5" />}
        />
      </section>
    </div>
  );
}

function Feature({ title, body, icon }: { title: string; body: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)]/40 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-[var(--color-heading)]">
        {icon}
        {title}
      </p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted)]">{body}</p>
    </div>
  );
}

function SampleBar({
  name,
  family,
  verdict,
  fillPct,
  tag,
  vramMark,
  overflow,
}: {
  name: string;
  family: string;
  verdict: "fast" | "offload" | "wontfit";
  fillPct: number;
  tag: string;
  vramMark?: number;
  overflow?: boolean;
}) {
  const color =
    verdict === "fast"
      ? "var(--color-fast)"
      : verdict === "offload"
        ? "var(--color-offload)"
        : "var(--color-wontfit)";
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-medium text-[var(--color-heading)]">{name}</span>
          <span className="text-xs text-[var(--color-faint)]">{family}</span>
        </div>
        <span
          className="rounded px-2 py-0.5 text-[0.7rem] font-semibold"
          style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color }}
        >
          {tag}
        </span>
      </div>
      <div className="relative mt-2 h-3 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
        <div
          className="bar-fill h-full rounded-full"
          style={{ width: `${Math.min(fillPct, 100)}%`, background: color }}
        />
        {overflow && (
          <div
            className="hatch absolute right-0 top-0 h-full rounded-r-full"
            style={{ width: `${Math.min(fillPct, 100)}%` }}
            aria-hidden
          />
        )}
        {vramMark != null && (
          <div
            className="absolute top-0 h-full w-0.5 bg-[var(--color-heading)]/70"
            style={{ left: `${vramMark}%` }}
            aria-hidden
          />
        )}
      </div>
    </div>
  );
}
