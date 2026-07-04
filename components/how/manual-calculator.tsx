"use client";

import { useState } from "react";
import { Calculator } from "lucide-react";
import {
  computeFootprint,
  QUANTS,
  CONTEXT_OPTIONS,
  DEFAULT_QUANT,
  DEFAULT_CONTEXT,
  type Quant,
} from "@/lib/memory";
import type { CatalogModel } from "@/lib/types";
import { fmtGB } from "@/lib/format";
import { FieldLabel, SelectField } from "../ui";
import { ModelPicker } from "../model/model-picker";

// Manual calculator: pick a catalog model, adjust quant + context + KV quant,
// and see the formula applied step-by-step using the model's real params
// (including anatomical KV fields from config.json).
export function ManualCalculator({ models }: { models: CatalogModel[] }) {
  const [slug, setSlug] = useState<string>(models.find((m) => m.name === "Qwen3 8B")?.slug ?? models[0]?.slug ?? "");
  const [quant, setQuant] = useState<Quant>(DEFAULT_QUANT);
  const [ctx, setCtx] = useState(DEFAULT_CONTEXT);
  const [kvq, setKvq] = useState(false);

  const model = models.find((m) => m.slug === slug) ?? models[0];
  const fp = computeFootprint({
    totalParamsB: model?.totalParams ?? 0,
    activeParamsB: model?.activeParams ?? null,
    quant,
    contextTokens: ctx,
    kvCacheQuantized: kvq,
    numLayers: model?.numLayers ?? null,
    numKvHeads: model?.numKvHeads ?? null,
    headDim: model?.headDim ?? null,
  });

  const kvMethod = (fp as { kvMethod?: string }).kvMethod ?? "empirical";
  const attn = model?.activeParams ?? model?.totalParams ?? 0;
  const isMoE = (model?.activeParams ?? null) != null;
  const quantBits = QUANTS.find((q) => q.value === quant)?.bits ?? 4;

  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-4 sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-heading)]">
        <Calculator className="h-4 w-4 text-[var(--color-accent)]" />
        Manual calculator
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Pick a model, adjust quantization and context, and watch the formula compute with the model&apos;s real parameters from Hugging Face.
      </p>

      <div className="mt-5 space-y-4">
        {/* model picker */}
        <div>
          <FieldLabel htmlFor="mc-model">Model</FieldLabel>
          <ModelPicker models={models} value={slug} onChange={setSlug} />
        </div>

        {/* quant + context + KV quant */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <FieldLabel htmlFor="mc-quant">Quantization</FieldLabel>
            <SelectField
              id="mc-quant"
              value={quant}
              onChange={setQuant}
              options={QUANTS.map((q) => ({ value: q.value, label: `${q.label} · ${q.bits}b` }))}
            />
          </div>
          <div>
            <FieldLabel htmlFor="mc-ctx">Context length</FieldLabel>
            <SelectField
              id="mc-ctx"
              value={ctx}
              onChange={setCtx}
              options={CONTEXT_OPTIONS.map((c) => ({ value: c.value, label: c.label }))}
            />
          </div>
          <div className="flex items-end pb-1">
            <label className="flex items-center gap-2 text-sm text-[var(--color-ink)]">
              <input
                type="checkbox"
                checked={kvq}
                onChange={(e) => setKvq(e.target.checked)}
                className="h-4 w-4 accent-[var(--color-accent)]"
              />
              q4 KV cache
            </label>
          </div>
        </div>
      </div>

      {/* model params summary */}
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        <ParamChip label="Total" value={`${model?.totalParams ?? 0}B`} />
        <ParamChip label="Active" value={model?.activeParams != null ? `${model.activeParams}B` : "—"} />
        <ParamChip label="Type" value={model?.isMoE ? "MoE" : "dense"} />
        <ParamChip label="Layers" value={model?.numLayers != null ? String(model.numLayers) : "—"} />
        <ParamChip label="KV heads" value={model?.numKvHeads != null ? String(model.numKvHeads) : "—"} />
        <ParamChip label="Head dim" value={model?.headDim != null ? String(model.headDim) : "—"} />
      </div>

      {/* step-by-step result */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)]/50 p-3">
          <div className="flex items-center justify-between">
            <p className="eyebrow">step-by-step</p>
            <span
              className="rounded px-1.5 py-0.5 text-[0.6rem] font-semibold"
              style={{
                background: `color-mix(in srgb, ${kvMethod === "anatomical" ? "var(--color-fast)" : "var(--color-offload)"} 16%, transparent)`,
                color: kvMethod === "anatomical" ? "var(--color-fast)" : "var(--color-offload)",
              }}
            >
              {kvMethod === "anatomical" ? "anatomical KV" : "empirical KV"}
            </span>
          </div>
          <BreakdownRow label="attnParams" value={`${attn}B ${isMoE ? "(active)" : "(total)"}`} />
          <BreakdownRow label="bits/weight" value={`${quantBits}`} />
          <BreakdownRow
            label="weights"
            value={`${model?.totalParams ?? 0} × ${quantBits} ÷ 8 = ${fmtGB(fp.weightsGB)}`}
            color="var(--color-fast)"
          />
          {kvMethod === "anatomical" && model?.numLayers != null && model?.numKvHeads != null && model?.headDim != null ? (
            <>
              <BreakdownRow label="KV/token" value={`2 × ${model.numLayers} × ${model.numKvHeads} × ${model.headDim} × ${kvq ? "0.5" : "2"}B = ${(2 * model.numLayers * model.numKvHeads * model.headDim * (kvq ? 0.5 : 2)).toLocaleString()} bytes`} />
              <BreakdownRow label="total KV" value={`${fmtGB(fp.kvGB)} = ${fmtGB(fp.kvGB)}`} color="var(--color-accent)" />
            </>
          ) : (
            <>
              <BreakdownRow label="kvPer1k" value={fp.kvPer1kGB.toFixed(4)} />
              <BreakdownRow label="total KV" value={`${fp.kvPer1kGB.toFixed(4)} × ${(ctx / 1000).toFixed(1)}${kvq ? " ÷ 4" : ""} = ${fmtGB(fp.kvGB)}`} color="var(--color-accent)" />
            </>
          )}
          <BreakdownRow label="overhead" value={`0.15 × ${fmtGB(fp.weightsGB + fp.kvGB)} = ${fmtGB(fp.overheadGB)}`} color="var(--color-offload)" />
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-elevated)] p-3 text-center">
          <span className="eyebrow">total memory</span>
          <span className="num mt-1 text-4xl font-bold text-[var(--color-heading)]">{fmtGB(fp.totalGB)}</span>
          <span className="mt-1 text-[0.7rem] text-[var(--color-faint)]">
            {model?.name ?? "—"} · {quant.toUpperCase()} · {(ctx / 1000).toFixed(0)}K ctx
          </span>
        </div>
      </div>
    </div>
  );
}

function ParamChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-[var(--color-line)] bg-[var(--color-surface-2)]/50 px-2 py-1">
      <div className="text-[0.6rem] uppercase tracking-wider text-[var(--color-faint)]">{label}</div>
      <div className="num text-sm font-semibold text-[var(--color-heading)]">{value}</div>
    </div>
  );
}

function BreakdownRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-xs">
      <span className="shrink-0 text-[var(--color-faint)]">{label}</span>
      <span className="num text-right" style={color ? { color } : { color: "var(--color-ink)" }}>{value}</span>
    </div>
  );
}