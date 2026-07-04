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
import { fmtGB } from "@/lib/format";
import { FieldLabel, NumberField, SelectField } from "../ui";

// Manual calculator: users enter params by hand and see the formula applied live.
// Complements Mode B (which picks from catalog) — here you type raw numbers.
export function ManualCalculator() {
  const [total, setTotal] = useState(8);
  const [active, setActive] = useState(0);
  const [quant, setQuant] = useState<Quant>(DEFAULT_QUANT);
  const [ctx, setCtx] = useState(DEFAULT_CONTEXT);
  const [kvq, setKvq] = useState(false);

  const fp = computeFootprint({
    totalParamsB: total,
    activeParamsB: active > 0 ? active : null,
    quant,
    contextTokens: ctx,
    kvCacheQuantized: kvq,
  });

  const attn = active > 0 ? active : total;
  const isMoE = active > 0;

  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-4 sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--color-heading)]">
        <Calculator className="h-4 w-4 text-[var(--color-accent)]" />
        Manual calculator
      </h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Enter model parameters by hand. Useful for models not in our catalog.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <div>
          <FieldLabel htmlFor="mc-total">Total params</FieldLabel>
          <NumberField id="mc-total" value={total} onChange={setTotal} min={0} step={1} suffix="B" />
        </div>
        <div>
          <FieldLabel htmlFor="mc-active">Active (MoE)</FieldLabel>
          <NumberField id="mc-active" value={active} onChange={setActive} min={0} step={1} suffix="B" />
        </div>
        <div>
          <FieldLabel htmlFor="mc-quant">Quantization</FieldLabel>
          <SelectField
            id="mc-quant"
            value={quant}
            onChange={setQuant}
            options={QUANTS.map((q) => ({ value: q.value, label: q.label }))}
          />
        </div>
        <div>
          <FieldLabel htmlFor="mc-ctx">Context</FieldLabel>
          <SelectField
            id="mc-ctx"
            value={ctx}
            onChange={setCtx}
            options={CONTEXT_OPTIONS.map((c) => ({ value: c.value, label: c.label }))}
          />
        </div>
      </div>

      <label className="mt-3 flex items-center gap-2 text-sm text-[var(--color-ink)]">
        <input
          type="checkbox"
          checked={kvq}
          onChange={(e) => setKvq(e.target.checked)}
          className="h-4 w-4 accent-[var(--color-accent)]"
        />
        q4 KV cache (divides KV by 4)
      </label>

      {/* result breakdown */}
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="space-y-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)]/50 p-3">
          <p className="eyebrow">step-by-step</p>
          <BreakdownRow label="attnParams" value={`${attn}B ${isMoE ? "(active)" : "(total)"}`} />
          <BreakdownRow label="bits/weight" value={`${QUANTS.find((q) => q.value === quant)?.bits}`} />
          <BreakdownRow label="weights" value={`${total} × ${QUANTS.find((q) => q.value === quant)?.bits} ÷ 8 = ${fmtGB(fp.weightsGB)}`} color="var(--color-fast)" />
          <BreakdownRow label="kvPer1k" value={fp.kvPer1kGB.toFixed(4)} />
          <BreakdownRow label="kv" value={`${fp.kvPer1kGB.toFixed(4)} × ${(ctx / 1000).toFixed(1)}${kvq ? " ÷ 4" : ""} = ${fmtGB(fp.kvGB)}`} color="var(--color-accent)" />
          <BreakdownRow label="overhead" value={`0.15 × ${fmtGB(fp.weightsGB + fp.kvGB)} = ${fmtGB(fp.overheadGB)}`} color="var(--color-offload)" />
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-[var(--color-line-strong)] bg-[var(--color-elevated)] p-3 text-center">
          <span className="eyebrow">total memory</span>
          <span className="num mt-1 text-4xl font-bold text-[var(--color-heading)]">{fmtGB(fp.totalGB)}</span>
          <span className="mt-1 text-[0.7rem] text-[var(--color-faint)]">
            {isMoE ? "MoE" : "dense"} · {quant.toUpperCase()} · {(ctx / 1000).toFixed(0)}K ctx
          </span>
        </div>
      </div>
    </div>
  );
}

function BreakdownRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 text-xs">
      <span className="text-[var(--color-faint)]">{label}</span>
      <span className="num text-right" style={color ? { color } : { color: "var(--color-ink)" }}>{value}</span>
    </div>
  );
}
