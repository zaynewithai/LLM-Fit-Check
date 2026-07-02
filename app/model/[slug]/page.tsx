import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, ExternalLink, Calculator } from "lucide-react";
import { getModelBySlug, getModels } from "@/lib/db";
import { fmtParamLabel, fmtGB } from "@/lib/format";
import { computeFootprint, DEFAULT_QUANT, DEFAULT_CONTEXT } from "@/lib/memory";
import { PerQuantTable } from "@/components/model/per-quant-table";
import { Eyebrow } from "@/components/ui";

export const metadata: Metadata = {
  title: "Model detail",
};

export async function generateStaticParams() {
  const models = await getModels();
  return models.map((m) => ({ slug: m.slug }));
}

export default async function ModelDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const model = await getModelBySlug(slug);
  if (!model) notFound();

  const fp = computeFootprint({
    totalParamsB: model.totalParams,
    activeParamsB: model.activeParams,
    quant: DEFAULT_QUANT,
    contextTokens: DEFAULT_CONTEXT,
    kvCacheQuantized: false,
  });

  const released = model.createdAt ? new Date(model.createdAt) : null;
  const synced = model.lastSyncedAt ? new Date(model.lastSyncedAt) : null;

  return (
    <div className="mx-auto w-full max-w-5xl px-4 sm:px-6">
      <div className="pt-6 pb-4 sm:pt-10">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-1.5 text-[0.8rem] text-[var(--color-muted)] hover:text-[var(--color-accent)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to catalog
        </Link>
        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 className="text-3xl font-semibold sm:text-4xl">{model.name}</h1>
          <span className="rounded px-2 py-0.5 text-[0.7rem] font-semibold text-[var(--color-accent)] border border-[var(--color-line-strong)] bg-[var(--color-surface)]">
            {model.family}
          </span>
        </div>
        <p className="mt-1.5 num text-sm text-[var(--color-muted)]">
          {fmtParamLabel(model.totalParams, model.activeParams)} · {model.isMoE ? "Mixture of experts" : "Dense"}
        </p>
      </div>

      {/* metadata grid */}
      <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Meta label="Total params" value={fmtParamLabel(model.totalParams, null).replace(" total", "")} />
        <Meta label="Active params" value={model.activeParams != null ? `${model.activeParams}B` : "—"} />
        <Meta label="Architecture" value={model.isMoE ? "MoE" : "Dense"} />
        <Meta label="Family" value={model.family} />
        <Meta label="Open weights" value={model.openWeights ? "Yes" : "No"} />
        <Meta label="Gated" value={model.gated ? "Yes" : "No"} />
        <Meta
          label="Released"
          value={released ? released.toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" }) : "—"}
        />
        <Meta
          label="Last synced"
          value={synced ? synced.toLocaleDateString("en", { year: "numeric", month: "short", day: "numeric" }) : "pending"}
        />
      </section>

      {/* links */}
      <section className="mt-4 flex flex-wrap gap-2.5">
        <a
          href={`https://huggingface.co/${model.repo}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] hover:border-[var(--color-accent)] hover:text-[var(--color-heading)]"
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Hugging Face
          <span className="num text-[0.65rem] text-[var(--color-faint)]">{model.repo}</span>
        </a>
        <Link
          href={`/model?src=catalog&slug=${model.slug}`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-accent)] px-3 py-2 text-sm font-semibold text-[#0a1120] hover:-translate-y-0.5 transition-transform"
        >
          <Calculator className="h-3.5 w-3.5" />
          Calculate for this model
        </Link>
      </section>

      {/* quick footprint */}
      <section className="mt-5 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-4 sm:p-5">
        <Eyebrow>footprint at a glance</Eyebrow>
        <div className="mt-2 flex items-baseline gap-3">
          <span className="num text-2xl font-semibold text-[var(--color-heading)]">{fmtGB(fp.totalGB)}</span>
          <span className="text-[0.7rem] text-[var(--color-faint)]">
            at {DEFAULT_QUANT.toUpperCase()} · {DEFAULT_CONTEXT / 1000}K context
          </span>
        </div>
      </section>

      {/* per-quant table */}
      <section className="mt-4 rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-4 sm:p-5 pb-16">
        <Eyebrow>per-quant memory table</Eyebrow>
        <div className="mt-3">
          <PerQuantTable totalParams={model.totalParams} activeParams={model.activeParams} />
        </div>
      </section>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-2.5">
      <div className="text-[0.65rem] uppercase tracking-wider text-[var(--color-muted)]">{label}</div>
      <div className="num mt-0.5 text-sm font-semibold text-[var(--color-heading)]">{value}</div>
    </div>
  );
}
