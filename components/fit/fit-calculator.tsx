"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import {
  computeModelFit,
  verdictBucket,
  DEFAULT_QUANT,
  DEFAULT_CONTEXT,
  type Quant,
  type MemoryMode,
  type HardwareConfig,
} from "@/lib/memory";
import type { CatalogModel } from "@/lib/types";
import { fmtGB } from "@/lib/format";
import { Segmented, NumberField, FieldLabel, Eyebrow } from "../ui";
import { QuantContextControls, type QuantContextState } from "../shared-controls";
import { ModelRow } from "./model-row";

export interface FitInputs {
  mode: MemoryMode;
  vram: number;
  ram: number;
  unified: number;
  quant: Quant;
  contextTokens: number;
  kvCacheQuantized: boolean;
}

const DEFAULTS: FitInputs = {
  mode: "discrete",
  vram: 24,
  ram: 64,
  unified: 64,
  quant: DEFAULT_QUANT,
  contextTokens: DEFAULT_CONTEXT,
  kvCacheQuantized: false,
};

export function FitCalculator({
  models,
  initial,
}: {
  models: CatalogModel[];
  initial: Partial<FitInputs>;
}) {
  const pathname = usePathname();
  const [s, setS] = useState<FitInputs>({ ...DEFAULTS, ...initial });

  // Keep the URL in sync so inputs are shareable + back-button friendly (no navigation).
  useEffect(() => {
    const p = new URLSearchParams();
    p.set("m", s.mode);
    if (s.mode === "discrete") {
      p.set("v", String(s.vram));
      p.set("r", String(s.ram));
    } else {
      p.set("u", String(s.unified));
    }
    p.set("q", s.quant);
    p.set("c", String(s.contextTokens));
    p.set("k", s.kvCacheQuantized ? "1" : "0");
    window.history.replaceState(null, "", `${pathname}?${p.toString()}`);
  }, [s, pathname]);

  const hw = useMemo<HardwareConfig>(
    () =>
      s.mode === "discrete"
        ? { mode: "discrete", vramGB: s.vram, ramGB: s.ram }
        : { mode: "unified", unifiedGB: s.unified },
    [s.mode, s.vram, s.ram, s.unified],
  );

  const fits = useMemo(
    () =>
      models
        .map((m) => ({
          model: m,
          fit: computeModelFit(
            {
              totalParamsB: m.totalParams,
              activeParamsB: m.activeParams,
              quant: s.quant,
              contextTokens: s.contextTokens,
              kvCacheQuantized: s.kvCacheQuantized,
            },
            hw,
          ),
        }))
        .sort((a, b) => a.fit.totalGB - b.fit.totalGB),
    [models, hw, s.quant, s.contextTokens, s.kvCacheQuantized],
  );

  const counts = useMemo(() => {
    const c = { fast: 0, usable: 0, "won't-fit": 0 };
    for (const f of fits) c[verdictBucket(f.fit.verdict)]++;
    return c;
  }, [fits]);

  const availableGB = s.mode === "discrete" ? s.vram + s.ram : s.unified;
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
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[var(--color-fast)] live-dot" />
            mode a · live
          </span>
        </Eyebrow>
        <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Hardware → Models</h1>
        <p className="mt-2 max-w-2xl text-[var(--color-muted)]">
          Enter your memory and see every open-weight model you can run, sorted by footprint.
        </p>
      </div>

      {/* controls */}
      <section
        aria-label="Hardware inputs"
        className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-4 sm:p-5"
      >
        <div className="grid gap-4 lg:grid-cols-[auto_1fr] lg:items-start lg:gap-6">
          <div className="space-y-3">
            <div>
              <FieldLabel>Memory type</FieldLabel>
              <Segmented<MemoryMode>
                ariaLabel="Memory type"
                value={s.mode}
                onChange={(mode) => setS({ ...s, mode })}
                options={[
                  { value: "discrete", label: "Discrete GPU + RAM" },
                  { value: "unified", label: "Unified memory" },
                ]}
              />
            </div>
            {s.mode === "discrete" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel htmlFor="vram">VRAM</FieldLabel>
                  <NumberField
                    id="vram"
                    value={s.vram}
                    onChange={(vram) => setS({ ...s, vram })}
                    min={0}
                    step={1}
                    suffix="GB"
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="ram">System RAM</FieldLabel>
                  <NumberField
                    id="ram"
                    value={s.ram}
                    onChange={(ram) => setS({ ...s, ram })}
                    min={0}
                    step={1}
                    suffix="GB"
                  />
                </div>
              </div>
            ) : (
              <div className="max-w-[12rem]">
                <FieldLabel htmlFor="unified">Unified memory</FieldLabel>
                <NumberField
                  id="unified"
                  value={s.unified}
                  onChange={(unified) => setS({ ...s, unified })}
                  min={0}
                  step={1}
                  suffix="GB"
                />
              </div>
            )}
          </div>
          <div>
            <FieldLabel>Quantization · context · KV cache</FieldLabel>
            <QuantContextControls
              value={qc}
              onChange={(v) =>
                setS((prev) => ({
                  ...prev,
                  quant: v.quant,
                  contextTokens: v.contextTokens,
                  kvCacheQuantized: v.kvCacheQuantized,
                }))
              }
            />
          </div>
        </div>
      </section>

      {/* summary strip */}
      <section
        aria-label="Summary"
        className="mt-4 grid grid-cols-3 gap-2 sm:gap-3"
      >
        <SummaryStat label="Runs fast" count={counts.fast} color="var(--color-fast)" />
        <SummaryStat
          label={s.mode === "unified" ? "Runs tight" : "Runs offloaded"}
          count={counts.usable}
          color="var(--color-offload)"
        />
        <SummaryStat label="Won't fit" count={counts["won't-fit"]} color="var(--color-wontfit)" />
      </section>

      <div className="mt-2 flex items-center justify-between px-1 text-[0.7rem] text-[var(--color-faint)]">
        <span>{fits.length} models · sorted by footprint ascending</span>
        <span className="num">
          budget: {fmtGB(availableGB)} {s.mode === "discrete" ? `(${fmtGB(s.vram)} VRAM)` : "unified"}
        </span>
      </div>

      {/* list */}
      <section aria-label="Model results" className="mt-3 grid gap-2.5 pb-16 sm:gap-3">
        {fits.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[var(--color-line)] p-10 text-center text-sm text-[var(--color-faint)]">
            No models in the catalog yet. Run <code className="num">npm run seed</code> to populate it.
          </div>
        ) : (
          fits.map((f, i) => (
            <ModelRow
              key={f.model.slug}
              model={f.model}
              fit={f.fit}
              mode={s.mode}
              index={i}
            />
          ))
        )}
      </section>
    </div>
  );
}

function SummaryStat({
  label,
  count,
  color,
}: {
  label: string;
  count: number;
  color: string;
}) {
  return (
    <div
      className="rounded-lg border bg-[var(--color-surface)]/60 p-2.5 sm:p-3"
      style={{ borderColor: `color-mix(in srgb, ${color} 28%, var(--color-line))` }}
    >
      <div className="num text-2xl font-semibold sm:text-3xl" style={{ color }}>
        {count}
      </div>
      <div className="text-[0.7rem] text-[var(--color-muted)] sm:text-[0.75rem]">{label}</div>
    </div>
  );
}
