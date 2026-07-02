"use client";

import { QUANTS, CONTEXT_OPTIONS, type Quant } from "@/lib/memory";
import { FieldLabel, SelectField, ToggleSwitch } from "./ui";

export interface QuantContextState {
  quant: Quant;
  contextTokens: number;
  kvCacheQuantized: boolean;
}

export function QuantContextControls({
  value,
  onChange,
}: {
  value: QuantContextState;
  onChange: (v: QuantContextState) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      <div>
        <FieldLabel htmlFor="quant">Quantization</FieldLabel>
        <SelectField
          id="quant"
          value={value.quant}
          onChange={(quant) => onChange({ ...value, quant })}
          options={QUANTS.map((q) => ({ value: q.value, label: `${q.label} · ${q.bits}b` }))}
        />
      </div>
      <div>
        <FieldLabel htmlFor="ctx">Context length</FieldLabel>
        <SelectField
          id="ctx"
          value={value.contextTokens}
          onChange={(contextTokens) => onChange({ ...value, contextTokens })}
          options={CONTEXT_OPTIONS.map((c) => ({ value: c.value, label: c.label }))}
        />
      </div>
      <div className="flex items-end pb-1">
        <ToggleSwitch
          id="kvq"
          label="q4 KV cache"
          checked={value.kvCacheQuantized}
          onChange={(kvCacheQuantized) => onChange({ ...value, kvCacheQuantized })}
        />
      </div>
    </div>
  );
}
