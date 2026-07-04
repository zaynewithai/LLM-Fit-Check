import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { getModels } from "@/lib/db";
import { FormulaCard } from "@/components/how/formula-card";
import { ManualCalculator } from "@/components/how/manual-calculator";
import { ParamsTable } from "@/components/how/params-table";

export const metadata: Metadata = {
  title: "How it works",
  description: "The memory calculation formula, a manual calculator, and all model parameter data.",
};

export const dynamic = "force-dynamic";

export default async function HowItWorksPage() {
  const models = await getModels();

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
      <div className="pt-6 pb-4 sm:pt-10">
        <span className="eyebrow">methodology</span>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">How it works</h1>
        <p className="mt-2 max-w-2xl text-[var(--color-muted)]">
          Every memory estimate on this site comes from one formula. Here it is, with a manual
          calculator and the full parameter reference so you can verify or compute by hand.
        </p>
      </div>

      <div className="space-y-5 pb-16">
        <FormulaCard />

        <ManualCalculator />

        <ParamsTable models={models} />

        <div className="flex flex-col gap-3 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-heading)]">Ready to check your hardware?</h3>
            <p className="mt-0.5 text-sm text-[var(--color-muted)]">Plug these numbers into the calculators.</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/fit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-semibold text-[#0a1120]"
            >
              Hardware → Models <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <Link
              href="/model"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-4 py-2 text-sm font-semibold text-[var(--color-ink)]"
            >
              Model → Hardware <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>

        <p className="text-[0.7rem] leading-relaxed text-[var(--color-faint)]">
          Weights are exact per quantization. KV cache is an estimate and varies by architecture
          (GQA, head dims). Real GGUF files run ~5–10% larger than theoretical weight size. For
          MoE models, total params drive memory; active params drive speed.
        </p>
      </div>
    </div>
  );
}
