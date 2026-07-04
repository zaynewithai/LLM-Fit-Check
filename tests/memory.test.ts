import { describe, it, expect } from "vitest";
import {
  BITS_PER_WEIGHT,
  computeFootprint,
  computeVerdict,
  computeModelFit,
  verdictBucket,
  type Footprint,
  type HardwareConfig,
} from "../lib/memory";
import { recommendHardware } from "../lib/hardware";

const glm52 = { totalParamsB: 744, activeParamsB: 40 }; // GLM-5.2 (MoE)

describe("bitsPerWeight", () => {
  it("matches spec §5.1", () => {
    expect(BITS_PER_WEIGHT).toEqual({
      fp16: 16,
      q8: 8,
      q6: 6,
      q5: 5,
      q4: 4,
      q3: 3,
      q2: 2,
    });
  });
});

describe("computeFootprint", () => {
  it("weights are exact: total * bits / 8", () => {
    const f = computeFootprint({ ...glm52, quant: "q4", contextTokens: 32_768, kvCacheQuantized: false });
    // 744 B * 4 bits / 8 = 372 GB
    expect(f.weightsGB).toBeCloseTo(372, 5);
  });

  it("uses ACTIVE params (not total) for MoE attention/KV sizing", () => {
    const f = computeFootprint({ ...glm52, quant: "q4", contextTokens: 32_768, kvCacheQuantized: false });
    expect(f.attnParamsB).toBe(40);
    // 0.5 * sqrt(40/70) = 0.3779644..., within [0.03, 0.9]
    expect(f.kvPer1kGB).toBeCloseTo(0.5 * Math.sqrt(40 / 70), 6);
  });

  it("total = weights + kv + 0.15*(weights+kv) for 744B @ Q4, 32K", () => {
    const f = computeFootprint({ ...glm52, quant: "q4", contextTokens: 32_768, kvCacheQuantized: false });
    // Per the §5.1 formula (the source of truth): 744 @ Q4 => 372 GB weights,
    // ~12.4 GB KV at 32K, ~57.7 GB overhead => ~442 GB total.
    expect(f.totalGB).toBeCloseTo(442.04, 1);
    expect(f.totalGB).toBe(f.weightsGB + f.kvGB + f.overheadGB);
  });

  // The spec's Definition-of-Done cites "744B @ Q4 / 32K ≈ 235 GB". That figure is
  // arithmetically inconsistent with the §5.1 formula (Q4 = 4 bits/weight => 372 GB
  // weights alone). The ≈235 value actually corresponds to Q2 (2 bits/weight => 186 GB
  // weights). We assert the formula-exact value for Q4 and the ≈235 value for Q2.
  it("744B @ Q2, 32K ≈ 235 GB (the figure cited in the spec's worked example)", () => {
    const f = computeFootprint({ ...glm52, quant: "q2", contextTokens: 32_768, kvCacheQuantized: false });
    expect(f.weightsGB).toBeCloseTo(186, 5);
    expect(f.totalGB).toBeCloseTo(228.14, 1);
    expect(f.totalGB).toBeGreaterThan(220);
    expect(f.totalGB).toBeLessThan(235);
  });

  it("quantizes KV cache (divides KV by 4)", () => {
    const base = computeFootprint({ ...glm52, quant: "q4", contextTokens: 32_768, kvCacheQuantized: false });
    const q4kv = computeFootprint({ ...glm52, quant: "q4", contextTokens: 32_768, kvCacheQuantized: true });
    expect(q4kv.kvGB).toBeCloseTo(base.kvGB / 4, 6);
  });

  it("clamps kvPer1k to [0.03, 0.9]", () => {
    const tiny = computeFootprint({ totalParamsB: 0.01, activeParamsB: null, quant: "q4", contextTokens: 1000, kvCacheQuantized: false });
    expect(tiny.kvPer1kGB).toBe(0.03); // floor
    const huge = computeFootprint({ totalParamsB: 100_000, activeParamsB: null, quant: "q4", contextTokens: 1000, kvCacheQuantized: false });
    expect(huge.kvPer1kGB).toBe(0.9); // ceiling
  });

  it("dense model uses total for attention", () => {
    const f = computeFootprint({ totalParamsB: 8, activeParamsB: null, quant: "q4", contextTokens: 32_768, kvCacheQuantized: false });
    expect(f.attnParamsB).toBe(8);
    expect(f.weightsGB).toBeCloseTo(4, 5); // 8*4/8
  });
});

describe("computeVerdict (Mode A)", () => {
  const discrete = (vram: number, ram: number): HardwareConfig => ({ mode: "discrete", vramGB: vram, ramGB: ram });
  const unified = (u: number): HardwareConfig => ({ mode: "unified", unifiedGB: u });
  const total = 11; // a small-ish model total

  it("discrete: fast when total <= VRAM", () => {
    expect(computeVerdict(total, discrete(12, 32))).toBe("fast");
  });
  it("discrete: offloaded when total <= VRAM+RAM but > VRAM", () => {
    expect(computeVerdict(total, discrete(8, 32))).toBe("offloaded");
  });
  it("discrete: won't-fit when total > VRAM+RAM", () => {
    expect(computeVerdict(total, discrete(4, 4))).toBe("won't-fit");
  });
  it("unified: fast when total <= 0.9*unified", () => {
    expect(computeVerdict(total, unified(16))).toBe("fast"); // 0.9*16=14.4 >= 11
  });
  it("unified: tight when total <= unified but > 0.9*unified", () => {
    expect(computeVerdict(total, unified(12))).toBe("tight"); // 0.9*12=10.8 < 11 <= 12
  });
  it("unified: won't-fit when total > unified", () => {
    expect(computeVerdict(total, unified(10))).toBe("won't-fit");
  });
});

describe("verdictBucket", () => {
  it("groups tight+offloaded into 'usable'", () => {
    expect(verdictBucket("fast")).toBe("fast");
    expect(verdictBucket("offloaded")).toBe("usable");
    expect(verdictBucket("tight")).toBe("usable");
    expect(verdictBucket("won't-fit")).toBe("won't-fit");
  });
});

describe("computeModelFit (end-to-end)", () => {
  it("returns footprint + verdict for an 8B dense model", () => {
    const fit = computeModelFit(
      { totalParamsB: 8, activeParamsB: null, quant: "q4", contextTokens: 32_768, kvCacheQuantized: false },
      { mode: "discrete", vramGB: 12, ramGB: 32 },
    );
    expect(fit.weightsGB).toBeCloseTo(4, 5);
    expect(fit.verdict).toBe("fast");
    expect(fit.availableGB).toBe(44);
  });
});

describe("recommendHardware (Mode B)", () => {
  it("small model: RTX 4070, 16 GB Mac, no offload", () => {
    const r = recommendHardware(10.97); // 8B @ Q4, 32K
    expect(r.fastDiscrete.label).toBe("RTX 4070 (12 GB)");
    expect(r.fastDiscrete.throughput).toBe("fast");
    expect(r.offloadedDiscrete).toBeNull();
    expect(r.unifiedMac.label).toBe("16 GB Mac");
  });

  it("mid model (30 GB): 2× RTX 3090, offload 24 + 6 RAM, 64 GB Mac", () => {
    const r = recommendHardware(30);
    expect(r.fastDiscrete.label).toBe("2× RTX 3090 (48 GB)");
    expect(r.offloadedDiscrete).not.toBeNull();
    expect(r.offloadedDiscrete!.detail).toContain("6 GB system RAM");
    expect(r.unifiedMac.label).toBe("64 GB Mac");
  });

  it("huge model (442 GB): server, offload 24 + 418 RAM, no single Mac", () => {
    const r = recommendHardware(442.04); // GLM-5.2 @ Q4
    expect(r.fastDiscrete.throughput).toBe("server-class");
    expect(r.offloadedDiscrete).not.toBeNull();
    expect(r.offloadedDiscrete!.detail).toContain("419 GB system RAM");
    expect(r.unifiedMac.label).toBe("No single Mac fits");
  });
});

describe("anatomical KV (precise, from config.json)", () => {
  // Qwen3-8B config.json: layers=36, kvHeads=8, headDim=128
  const qwen3_8b_cfg = { numLayers: 36, numKvHeads: 8, headDim: 128 };

  it("matches the manual anatomical formula: 2×layers×kvHeads×headDim×2 bytes × ctx / 1e9", () => {
    const f = computeFootprint({
      totalParamsB: 8, activeParamsB: null, quant: "fp16", contextTokens: 32768, kvCacheQuantized: false,
      ...qwen3_8b_cfg,
    });
    // 2 (K+V) × 36 × 8 × 128 × 2 bytes × 32768 / 1e9 = 4.8316 GB
    expect(f.kvGB).toBeCloseTo(4.832, 2);
    expect((f as Footprint & { kvMethod: string }).kvMethod).toBe("anatomical");
  });

  it("kw cache quantization (÷4) applies to anatomical too", () => {
    const base = computeFootprint({
      totalParamsB: 8, activeParamsB: null, quant: "fp16", contextTokens: 32768, kvCacheQuantized: false,
      ...qwen3_8b_cfg,
    });
    const q4 = computeFootprint({
      totalParamsB: 8, activeParamsB: null, quant: "fp16", contextTokens: 32768, kvCacheQuantized: true,
      ...qwen3_8b_cfg,
    });
    // q4 KV → bytesPerParam 2 → 0.5, factor 4x smaller
    expect(q4.kvGB).toBeCloseTo(base.kvGB / 4, 2);
  });

  it("falls back to empirical when anatomical fields are absent", () => {
    const empirical = computeFootprint({
      totalParamsB: 8, activeParamsB: null, quant: "fp16", contextTokens: 32768, kvCacheQuantized: false,
    });
    expect((empirical as Footprint & { kvMethod: string }).kvMethod).toBe("empirical");
  });

  it("falls back to empirical when anatomical fields are zero/null", () => {
    const f = computeFootprint({
      totalParamsB: 8, activeParamsB: null, quant: "fp16", contextTokens: 32768, kvCacheQuantized: false,
      numLayers: 0, numKvHeads: null, headDim: 128,
    });
    expect((f as Footprint & { kvMethod: string }).kvMethod).toBe("empirical");
  });

  it("total includes weights + anatomical KV + overhead", () => {
    const f = computeFootprint({
      totalParamsB: 8, activeParamsB: null, quant: "q4", contextTokens: 32768, kvCacheQuantized: false,
      ...qwen3_8b_cfg,
    });
    // weights = 8 × 4 / 8 = 4 GB; KV = 4.832 GB; overhead = 0.15 × (4 + 4.832) = 1.325
    expect(f.weightsGB).toBeCloseTo(4, 5);
    expect(f.kvGB).toBeCloseTo(4.832, 2);
    expect(f.totalGB).toBeCloseTo(f.weightsGB + f.kvGB + f.overheadGB, 5);
  });
});
