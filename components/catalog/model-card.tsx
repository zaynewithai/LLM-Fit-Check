import Link from "next/link";
import { Download } from "lucide-react";
import type { CatalogModel } from "@/lib/types";
import type { Footprint, Verdict } from "@/lib/memory";
import { VerdictBadge } from "../verdict-badge";
import { fmtGB, fmtParamLabel, fmtCompact } from "@/lib/format";

export function ModelCard({
  model,
  fp,
  verdict,
  quant,
}: {
  model: CatalogModel;
  fp: Footprint;
  verdict: Verdict | null;
  quant: string;
}) {
  return (
    <Link
      href={`/model/${model.slug}`}
      className="group flex flex-col rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-3 transition-colors hover:border-[var(--color-accent)] hover:bg-[var(--color-surface)] sm:p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold text-[var(--color-heading)] group-hover:text-[var(--color-accent)]">
            {model.name}
          </div>
          <div className="mt-0.5 text-[0.7rem] text-[var(--color-faint)]">
            {model.family} · {model.isMoE ? "MoE" : "dense"}
          </div>
        </div>
        {verdict && <VerdictBadge verdict={verdict} size="xs" />}
      </div>

      <div className="mt-auto pt-3">
        <div className="flex items-center justify-between text-[0.7rem] text-[var(--color-muted)]">
          <span className="num">{fmtParamLabel(model.totalParams, model.activeParams)}</span>
          <span className="flex items-center gap-1" title={`${model.downloads.toLocaleString()} downloads`}>
            <Download className="h-3 w-3" />
            <span className="num">{fmtCompact(model.downloads)}</span>
          </span>
        </div>
        <div className="mt-1 flex items-baseline justify-between">
          <span className="num text-lg font-semibold text-[var(--color-heading)]">{fmtGB(fp.totalGB)}</span>
          <span className="text-[0.65rem] uppercase text-[var(--color-faint)]">{quant}</span>
        </div>
      </div>
    </Link>
  );
}
