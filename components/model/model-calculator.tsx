"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  computeFootprint,
  QUANTS,
  DEFAULT_QUANT,
  DEFAULT_CONTEXT,
  type Quant,
} from "@/lib/memory";
import { recommendHardware } from "@/lib/hardware";
import type { CatalogModel } from "@/lib/types";
import { fmtGB, fmtParamLabel } from "@/lib/format";
import { Segmented, NumberField, FieldLabel, Eyebrow } from "../ui";
import { QuantContextControls, type QuantContextState } from "../shared-controls";
import { ModelPicker } from "./model-picker";
import { CompositionBar } from "./composition-bar";
import { HardwareCard } from "./hardware-card";

export interface ModelInputs {
  source: "catalog" | "custom";
  slug: string;
  customName: string;
  customTotal: number;
  customActive: number;
  quant: Quant;
  contextTokens: number;
  kvCacheQuantized: boolean;
}

const DEFAULTS: Omit<ModelInputs, "slug"> = {
  source: "catalog",
  customName: "",
  customTotal: 14,
  customActive: 0,
  quant: DEFAULT_QUANT,
  contextTokens: DEFAULT_CONTEXT,
  kvCacheQuantized: false,
};

export function ModelCalculator({
  models,
  initial,
}: {
  models: CatalogModel[];
  initial: Partial<ModelInputs>;
}) {
  const pathname = usePathname();
  const [s, setS] = useState<ModelInputs>({
    ...DEFAULTS,
    slug: initial.slug ?? models[0]?.slug ?? "",
    ...initial,
  });

  useEffect(() => {
    const p = new URLSearchParams();
    p.set("src", s.source);
    if (s.source === "catalog") p.set("slug", s.slug);
    else {
      p.set("n", s.customName);
      p.set("t", String(s.customTotal));
      if (s.customActive > 0) p.set("a", String(s.customActive));
    }
    p.set("q", s.quant);
    p.set("c", String(s.contextTokens));
    p.set("k", s.kvCacheQuantized ? "1" : "0");
    window.history.replaceState(null, "", `${pathname}?${p.toString()}`);
  }, [s, pathname]);

  const eff = useMemo(() => {
    if (s.source === "custom") {
      return {
        name: s.customName.trim() || "Custom model",
        totalParams: s.customTotal,
        activeParams: s.customActive > 0 ? s.customActive : null,
        isMoE: s.customActive > 0,
      };
    }
    const m = models.find((x) => x.slug === s.slug) ?? models[0];
    return {
      name: m?.name ?? "Unknown",
      totalParams: m?.totalParams ?? 0,
      activeParams: m?.activeParams ?? null,
      isMoE: m?.isMoE ?? false,
    };
  }, [s, models]);

  const fp = useMemo(
    () =>
      computeFootprint({
        totalParamsB: eff.totalParams,
        activeParamsB: eff.activeParams,
        quant: s.quant,
        contextTokens: s.contextTokens,
        kvCacheQuantized: s.kvCacheQuantized,
      }),
    [eff, s.quant, s.contextTokens, s.kvCacheQuantized],
  );

  const rec = useMemo(() => recommendHardware(fp.totalGB), [fp.totalGB]);

  // Suggest a more aggressive quant if it doesn't fit a common 24 GB GPU.
  const dropNote = useMemo(() => {
    const COMMON = 24;
    const base = {
      totalParamsB: eff.totalParams,
      activeParamsB: eff.activeParams,
      contextTokens: s.contextTokens,
      kvCacheQuantized: s.kvCacheQuantized,
    };
    const cur = computeFootprint({ ...base, quant: s.quant });
    if (cur.totalGB <= COMMON) return null;
    const curIdx = QUANTS.findIndex((q) => q.value === s.quant);
    for (let i = curIdx + 1; i < QUANTS.length; i++) {
      const q = QUANTS[i].value;
      const f = computeFootprint({ ...base, quant: q });
      if (f.totalGB <= COMMON) return { quant: q, totalGB: f.totalGB, current: s.quant };
    }
    const last = computeFootprint({ ...base, quant: "q2" });
    return { quant: null as Quant | null, totalGB: last.totalGB, current: s.quant };
  }, [eff, s.quant, s.contextTokens, s.kvCacheQuantized]);

  const qc: QuantContextState = {
    quant: s.quant,
    contextTokens: s.contextTokens,
    kvCacheQuantized: s.kvCacheQuantized,
  };

  return (
    <div className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div className="pt-6 pb-4 sm:pt-10">
        <Eyebrow>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-accent)] live-dot" />
            mode b
          </span>
        </Eyebrow>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Model → Hardware</h1>
        <p className="mt-2 max-w-2xl text-[var(--color-muted)]">
          Pick a model or enter custom params. Get the memory footprint and the concrete hardware you need.
        </p>
      </div>

      {/* controls */}
      <section
        aria-label="Model inputs"
        className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-4 sm:p-5"
      >
        <div className="mb-4">
          <FieldLabel>Source</FieldLabel>
          <Segmented<"catalog" | "custom">
            ariaLabel="Model source"
            value={s.source}
            onChange={(source) => setS((p) => ({ ...p, source }))}
            options={[
              { value: "catalog", label: "From catalog" },
              { value: "custom", label: "Custom model" },
            ]}
          />
        </div>

        {s.source === "catalog" ? (
          <div>
            <FieldLabel htmlFor="picker">Model</FieldLabel>
            <ModelPicker models={models} value={s.slug} onChange={(slug) => setS((p) => ({ ...p, slug }))} />
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-1">
              <FieldLabel htmlFor="cname">Name</FieldLabel>
              <input
                id="cname"
                type="text"
                value={s.customName}
                onChange={(e) => setS((p) => ({ ...p, customName: e.target.value }))}
                placeholder="My model"
                className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
              />
            </div>
            <div>
              <FieldLabel htmlFor="ctotal">Total params</FieldLabel>
              <NumberField
                id="ctotal"
                value={s.customTotal}
                onChange={(customTotal) => setS((p) => ({ ...p, customTotal }))}
                min={0}
                step={1}
                suffix="B"
              />
            </div>
            <div>
              <FieldLabel htmlFor="cactive">Active (MoE)</FieldLabel>
              <NumberField
                id="cactive"
                value={s.customActive}
                onChange={(customActive) => setS((p) => ({ ...p, customActive }))}
                min={0}
                step={1}
                suffix="B"
              />
            </div>
          </div>
        )}

        <div className="mt-4 border-t border-[var(--color-line)] pt-4">
          <FieldLabel>Quantization · context · KV cache</FieldLabel>
          <QuantContextControls
            value={qc}
            onChange={(v) =>
              setS((p) => ({
                ...p,
                quant: v.quant,
                contextTokens: v.contextTokens,
                kvCacheQuantized: v.kvCacheQuantized,
              }))
            }
          />
        </div>
      </section>

      {/* results */}
      <section aria-label="Results" className="mt-4 space-y-4 pb-16">
        {/* footprint */}
        <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-4 sm:p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <div>
              <h2 className="text-lg font-semibold text-[var(--color-heading)]">{eff.name}</h2>
              <p className="text-[0.7rem] text-[var(--color-faint)]">
                {fmtParamLabel(eff.totalParams, eff.activeParams)}
                {eff.isMoE ? " · MoE" : " · dense"}
                {" · "}
                <span className="uppercase">{s.quant}</span> · {(s.contextTokens / 1000).toFixed(0)}K ctx
              </p>
            </div>
            <div className="text-right">
              <div className="num text-3xl font-semibold text-[var(--color-heading)] sm:text-4xl">
                {fmtGB(fp.totalGB)}
              </div>
              <div className="text-[0.7rem] text-[var(--color-faint)]">total memory</div>
            </div>
          </div>
          <div className="mt-4">
            <CompositionBar f={fp} />
          </div>
        </div>

        {/* hardware recommendations */}
        <div>
          <h3 className="eyebrow mb-2">Hardware recommendations</h3>
          <div className="grid gap-3 sm:grid-cols-3">
            <HardwareCard kind="fast" path={rec.fastDiscrete} />
            {rec.offloadedDiscrete ? (
              <HardwareCard kind="offloaded" path={rec.offloadedDiscrete} />
            ) : (
              <div className="rounded-lg border border-dashed border-[var(--color-line)] p-4 text-sm text-[var(--color-faint)]">
                Fits in a single 24 GB GPU — no offload needed.
              </div>
            )}
            <HardwareCard kind="unified" path={rec.unifiedMac} />
          </div>
        </div>

        {/* drop-quant note */}
        {dropNote && (
          <div className="rounded-lg border border-[var(--color-offload)]/40 bg-[var(--color-offload-soft)]/40 p-3 text-sm text-[var(--color-ink)]">
            {dropNote.quant ? (
              <>
                At <span className="num font-semibold uppercase">{dropNote.quant}</span> it fits a
                24 GB GPU (<span className="num">{fmtGB(dropNote.totalGB)}</span>) — drop from{" "}
                <span className="num uppercase">{dropNote.current}</span> to run it on common hardware.
              </>
            ) : (
              <>
                Even at <span className="num font-semibold uppercase">Q2</span> it needs{" "}
                <span className="num">{fmtGB(dropNote.totalGB)}</span> — no single common GPU fits. Use
                offload, a unified Mac, or a multi-GPU server.
              </>
            )}
          </div>
        )}

        {/* disclaimer */}
        <p className="text-[0.7rem] leading-relaxed text-[var(--color-faint)]">
          Weights are exact per quantization. KV cache is an estimate and varies by architecture
          (GQA, head dims). Real GGUF files run ~5–10% larger than the theoretical weight size. For
          MoE models, total params drive memory; active params drive speed.
        </p>
      </section>
    </div>
  );
}
