"use client";

import {
  type MemoryMode,
  type Quant,
  QUANTS,
  CONTEXT_OPTIONS,
  DEFAULT_QUANT,
  DEFAULT_CONTEXT,
} from "@/lib/memory";
import { Segmented, SelectField, NumberField, FieldLabel, ToggleSwitch } from "../ui";
import { QuantContextControls, type QuantContextState } from "../shared-controls";

export type SizeKey = "all" | "le8" | "8-34" | "34-100" | "100-400" | "gt400";

export const SIZE_OPTIONS: { value: SizeKey; label: string }[] = [
  { value: "all", label: "All sizes" },
  { value: "le8", label: "≤ 8B" },
  { value: "8-34", label: "8 – 34B" },
  { value: "34-100", label: "34 – 100B" },
  { value: "100-400", label: "100 – 400B" },
  { value: "gt400", label: "> 400B" },
];

export function sizeMatch(total: number, key: SizeKey): boolean {
  switch (key) {
    case "le8":
      return total <= 8;
    case "8-34":
      return total > 8 && total <= 34;
    case "34-100":
      return total > 34 && total <= 100;
    case "100-400":
      return total > 100 && total <= 400;
    case "gt400":
      return total > 400;
    default:
      return true;
  }
}

export interface CatalogState {
  search: string;
  family: string;
  size: SizeKey;
  arch: "all" | "dense" | "moe";
  fit: boolean;
  mode: MemoryMode;
  vram: number;
  ram: number;
  unified: number;
  quant: Quant;
  contextTokens: number;
  kvCacheQuantized: boolean;
  sort: "params" | "footprint";
}

export function Filters({
  state,
  onChange,
  families,
}: {
  state: CatalogState;
  onChange: (patch: Partial<CatalogState>) => void;
  families: string[];
}) {
  const qc: QuantContextState = {
    quant: state.quant,
    contextTokens: state.contextTokens,
    kvCacheQuantized: state.kvCacheQuantized,
  };

  return (
    <div className="space-y-4">
      <div>
        <FieldLabel htmlFor="cat-search">Search</FieldLabel>
        <input
          id="cat-search"
          type="search"
          value={state.search}
          onChange={(e) => onChange({ search: e.target.value })}
          placeholder="Name, family or repo…"
          className="w-full rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-2 text-sm text-[var(--color-ink)] outline-none focus:border-[var(--color-accent)]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel htmlFor="cat-family">Family</FieldLabel>
          <SelectField
            id="cat-family"
            value={state.family}
            onChange={(family) => onChange({ family })}
            options={[{ value: "all", label: "All families" }, ...families.map((f) => ({ value: f, label: f }))]}
          />
        </div>
        <div>
          <FieldLabel htmlFor="cat-arch">Architecture</FieldLabel>
          <SelectField
            id="cat-arch"
            value={state.arch}
            onChange={(arch) => onChange({ arch })}
            options={[
              { value: "all", label: "All" },
              { value: "dense", label: "Dense" },
              { value: "moe", label: "MoE" },
            ]}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel htmlFor="cat-size">Size</FieldLabel>
          <SelectField
            id="cat-size"
            value={state.size}
            onChange={(size) => onChange({ size })}
            options={SIZE_OPTIONS}
          />
        </div>
        <div>
          <FieldLabel htmlFor="cat-sort">Sort by</FieldLabel>
          <SelectField
            id="cat-sort"
            value={state.sort}
            onChange={(sort) => onChange({ sort })}
            options={[
              { value: "params", label: "Parameter count" },
              { value: "footprint", label: "Memory footprint" },
            ]}
          />
        </div>
      </div>

      <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)]/50 p-3">
        <ToggleSwitch
          id="cat-fit"
          label="Fits my rig"
          checked={state.fit}
          onChange={(fit) => onChange({ fit })}
        />
        <p className="mt-1.5 text-[0.7rem] text-[var(--color-faint)]">
          {state.fit ? "Showing only models that run on your hardware." : "Enable to filter to models that fit your memory."}
        </p>

        {state.fit && (
          <div className="mt-3 space-y-3 border-t border-[var(--color-line)] pt-3">
            <div>
              <FieldLabel>Memory type</FieldLabel>
              <Segmented<MemoryMode>
                ariaLabel="Memory type"
                value={state.mode}
                onChange={(mode) => onChange({ mode })}
                options={[
                  { value: "discrete", label: "GPU + RAM" },
                  { value: "unified", label: "Unified" },
                ]}
              />
            </div>
            {state.mode === "discrete" ? (
              <div className="grid grid-cols-2 gap-2">
                <NumberField id="cat-vram" value={state.vram} onChange={(vram) => onChange({ vram })} min={0} step={1} suffix="GB" />
                <NumberField id="cat-ram" value={state.ram} onChange={(ram) => onChange({ ram })} min={0} step={1} suffix="GB" />
              </div>
            ) : (
              <NumberField id="cat-uni" value={state.unified} onChange={(unified) => onChange({ unified })} min={0} step={1} suffix="GB" />
            )}
            <QuantContextControls
              value={qc}
              onChange={(v) =>
                onChange({
                  quant: v.quant,
                  contextTokens: v.contextTokens,
                  kvCacheQuantized: v.kvCacheQuantized,
                })
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}

export const CATALOG_DEFAULTS: Omit<CatalogState, never> = {
  search: "",
  family: "all",
  size: "all",
  arch: "all",
  fit: false,
  mode: "discrete",
  vram: 24,
  ram: 64,
  unified: 64,
  quant: DEFAULT_QUANT,
  contextTokens: DEFAULT_CONTEXT,
  kvCacheQuantized: false,
  sort: "params",
};

export const QUANT_LABELS = QUANTS;
export const CONTEXT_LABELS = CONTEXT_OPTIONS;
