// Memory-footprint calculation engine — the single source of truth (spec §5.1, §5.2).
// Pure module: no Prisma, no server-only imports. Safe to use in Client Components.

export type Quant = "fp16" | "q8" | "q6" | "q5" | "q4" | "q3" | "q2";
export type Verdict = "fast" | "offloaded" | "tight" | "won't-fit";
export type MemoryMode = "discrete" | "unified";

export const BITS_PER_WEIGHT: Record<Quant, number> = {
  fp16: 16,
  q8: 8,
  q6: 6,
  q5: 5,
  q4: 4,
  q3: 3,
  q2: 2,
};

export const QUANTS: { value: Quant; label: string; bits: number }[] = [
  { value: "fp16", label: "FP16", bits: 16 },
  { value: "q8", label: "Q8", bits: 8 },
  { value: "q6", label: "Q6", bits: 6 },
  { value: "q5", label: "Q5", bits: 5 },
  { value: "q4", label: "Q4", bits: 4 },
  { value: "q3", label: "Q3", bits: 3 },
  { value: "q2", label: "Q2", bits: 2 },
];

export const CONTEXT_OPTIONS: { value: number; label: string }[] = [
  { value: 4_096, label: "4K" },
  { value: 8_192, label: "8K" },
  { value: 16_384, label: "16K" },
  { value: 32_768, label: "32K" },
  { value: 131_072, label: "128K" },
  { value: 262_144, label: "256K" },
  { value: 1_000_000, label: "1M" },
];

export const DEFAULT_QUANT: Quant = "q4";
export const DEFAULT_CONTEXT = 32_768;

export interface FootprintInput {
  totalParamsB: number;
  activeParamsB: number | null;
  quant: Quant;
  contextTokens: number;
  kvCacheQuantized: boolean;
  // Anatomical fields from config.json (optional — when present, enable precise KV).
  // Null/absent → fall back to the empirical formula (spec §5.1).
  numLayers?: number | null;
  numKvHeads?: number | null;
  headDim?: number | null;
}

export interface Footprint {
  weightsGB: number;
  kvGB: number;
  overheadGB: number;
  totalGB: number;
  kvPer1kGB: number;
  attnParamsB: number;
  bits: number;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

export function kvPer1k(attnParamsB: number): number {
  return clamp(0.5 * Math.sqrt(attnParamsB / 70), 0.03, 0.9);
}

// Anatomical KV: KV per token (bytes) = 2 (K+V) × layers × kvHeads × headDim × bytesPerParam
// bytesPerParam = 2 for fp16; divided by 4 when kvCacheQuantized (q4 KV).
function anatomicalKvGB(
  numLayers: number,
  numKvHeads: number,
  headDim: number,
  contextTokens: number,
  kvCacheQuantized: boolean,
): number {
  const bytesPerParam = kvCacheQuantized ? 0.5 : 2; // fp16=2 bytes, q4=0.5 bytes
  const kvPerTokenBytes = 2 * numLayers * numKvHeads * headDim * bytesPerParam;
  return (kvPerTokenBytes * contextTokens) / 1e9;
}

export function computeFootprint(i: FootprintInput): Footprint {
  const bits = BITS_PER_WEIGHT[i.quant];
  const weightsGB = (i.totalParamsB * bits) / 8;

  const attnParamsB = i.activeParamsB ?? i.totalParamsB;
  const hasAnatomical =
    i.numLayers != null && i.numKvHeads != null && i.headDim != null &&
    i.numLayers > 0 && i.numKvHeads > 0 && i.headDim > 0;

  let kvGB: number;
  let per1k: number;
  if (hasAnatomical) {
    kvGB = anatomicalKvGB(i.numLayers!, i.numKvHeads!, i.headDim!, i.contextTokens, i.kvCacheQuantized);
    per1k = (kvGB / (i.contextTokens / 1000)) || 0; // derive per1k for display
  } else {
    per1k = kvPer1k(attnParamsB);
    kvGB = per1k * (i.contextTokens / 1000);
    if (i.kvCacheQuantized) kvGB = kvGB / 4;
  }

  const overheadGB = 0.15 * (weightsGB + kvGB);
  const totalGB = weightsGB + kvGB + overheadGB;

  return {
    weightsGB,
    kvGB,
    overheadGB,
    totalGB,
    kvPer1kGB: per1k,
    attnParamsB,
    bits,
    // flag: whether the precise anatomical formula was used
    kvMethod: hasAnatomical ? "anatomical" : "empirical",
  } as Footprint & { kvMethod: string };
}

export interface HardwareConfig {
  mode: MemoryMode;
  vramGB?: number;
  ramGB?: number;
  unifiedGB?: number;
}

export function availableMemory(hw: HardwareConfig): number {
  return hw.mode === "unified" ? hw.unifiedGB ?? 0 : (hw.vramGB ?? 0) + (hw.ramGB ?? 0);
}

export function computeVerdict(totalGB: number, hw: HardwareConfig): Verdict {
  if (hw.mode === "unified") {
    const u = hw.unifiedGB ?? 0;
    if (totalGB <= u * 0.9) return "fast";
    if (totalGB <= u) return "tight";
    return "won't-fit";
  }
  const vram = hw.vramGB ?? 0;
  const ram = hw.ramGB ?? 0;
  if (totalGB <= vram) return "fast";
  if (totalGB <= vram + ram) return "offloaded";
  return "won't-fit";
}

export interface ModelFit extends Footprint {
  verdict: Verdict;
  availableGB: number;
  vramGB: number;
}

export function computeModelFit(input: FootprintInput, hw: HardwareConfig): ModelFit {
  const f = computeFootprint(input);
  return {
    ...f,
    verdict: computeVerdict(f.totalGB, hw),
    availableGB: availableMemory(hw),
    vramGB: hw.mode === "unified" ? (hw.unifiedGB ?? 0) : (hw.vramGB ?? 0),
  };
}

// Group "tight" with "offloaded" for the three-bucket summary strip (fast / usable / won't-fit).
export type SummaryBucket = "fast" | "usable" | "won't-fit";
export function verdictBucket(v: Verdict): SummaryBucket {
  if (v === "fast") return "fast";
  if (v === "won't-fit") return "won't-fit";
  return "usable"; // offloaded + tight
}
