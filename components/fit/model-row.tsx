import Link from "next/link";
import type { CatalogModel } from "@/lib/types";
import type { ModelFit } from "@/lib/memory";
import { BudgetBar } from "../budget-bar";
import { VerdictBadge } from "../verdict-badge";
import { fmtGB, fmtParamLabel } from "@/lib/format";

export function ModelRow({
  model,
  fit,
  mode,
  index,
}: {
  model: CatalogModel;
  fit: ModelFit;
  mode: "discrete" | "unified";
  index: number;
}) {
  return (
    <div
      className="row-in rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-3 transition-colors hover:border-[var(--color-line-strong)] hover:bg-[var(--color-surface)] sm:p-4"
      style={{ animationDelay: `${Math.min(index * 24, 360)}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <Link
            href={`/model/${model.slug}`}
            className="truncate text-sm font-semibold text-[var(--color-heading)] hover:text-[var(--color-accent)]"
          >
            {model.name}
          </Link>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.7rem] text-[var(--color-faint)]">
            <span>{model.family}</span>
            <span aria-hidden>·</span>
            <span>{model.isMoE ? "MoE" : "dense"}</span>
            <span aria-hidden>·</span>
            <span className="num">{fmtParamLabel(model.totalParams, model.activeParams)}</span>
          </div>
        </div>
        <VerdictBadge verdict={fit.verdict} />
      </div>

      <div className="mt-3">
        <BudgetBar
          totalGB={fit.totalGB}
          availableGB={fit.availableGB}
          vramGB={fit.vramGB}
          mode={mode}
          verdict={fit.verdict}
        />
      </div>

      <div className="mt-2 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 text-[0.7rem]">
        <span className="num text-sm font-semibold text-[var(--color-heading)]">
          {fmtGB(fit.totalGB)} <span className="text-[var(--color-faint)] font-normal">needed</span>
        </span>
        <span className="num text-[var(--color-faint)]">
          {fmtGB(fit.weightsGB)} weights · {fmtGB(fit.kvGB)} KV · {fmtGB(fit.overheadGB)} overhead
        </span>
      </div>
    </div>
  );
}
