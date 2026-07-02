// Maps a total memory footprint (GB) to named, concrete hardware (spec §5.3).
// Pure module: no Prisma, no server-only imports. Safe in Client Components.

import type { MemoryMode } from "./memory";

export type Throughput = "fast" | "usable" | "server-class";

export const THROUGHPUT_LABELS: Record<Throughput, string> = {
  fast: "fast (in-VRAM)",
  usable: "~3–9 tok/s (usable)",
  "server-class": "server-class",
};

export interface GpuTier {
  vramGB: number;
  label: string;
}
export interface MacTier {
  unifiedGB: number;
  label: string;
}

// Discrete GPU/multi-GPU ladder (spec §5.3), ascending by real VRAM capacity.
// "Smallest tier that meets the requirement" => smallest vramGB >= ceil(totalGB).
export const GPU_TIERS: GpuTier[] = [
  { vramGB: 8, label: "RTX 3060 (8 GB)" },
  { vramGB: 12, label: "RTX 4070 (12 GB)" },
  { vramGB: 16, label: "RTX 4060 Ti (16 GB)" },
  { vramGB: 24, label: "RTX 4090 / 3090 (24 GB)" },
  { vramGB: 48, label: "2× RTX 3090 (48 GB)" },
  { vramGB: 80, label: "A100 80 GB" },
  { vramGB: 160, label: "2× H100 (160 GB)" },
  { vramGB: 320, label: "4× A100 80 GB (320 GB) / workstation" },
];

// The 24 GB consumer card used as the offload base.
export const OFFLOAD_GPU = "RTX 4090 / 3090 (24 GB)";
export const OFFLOAD_GPU_VRAM = 24;

// Mac unified-memory ladder, ascending by real capacity.
export const MAC_TIERS: MacTier[] = [
  { unifiedGB: 16, label: "16 GB Mac" },
  { unifiedGB: 24, label: "24 GB Mac" },
  { unifiedGB: 32, label: "32 GB Mac" },
  { unifiedGB: 64, label: "64 GB Mac" },
  { unifiedGB: 96, label: "96 GB Mac" },
  { unifiedGB: 192, label: "192 GB Mac" },
  { unifiedGB: 256, label: "Mac Studio 256 GB" },
];

export const SERVER_LABEL = "8× A100 / 8× H200 server";
const SERVER_THRESHOLD_GB = 256;

export interface PathResult {
  label: string;
  detail: string;
  throughput: Throughput;
}

export interface HardwareRecommendation {
  fastDiscrete: PathResult;
  offloadedDiscrete: PathResult | null;
  unifiedMac: PathResult;
}

function pickGpu(reqVram: number): { label: string; vramGB: number } | null {
  for (const t of GPU_TIERS) if (t.vramGB >= reqVram) return t;
  return null;
}

function pickMac(reqUnified: number): MacTier | null {
  for (const t of MAC_TIERS) if (t.unifiedGB >= reqUnified) return t;
  return null;
}

export function recommendHardware(totalGB: number): HardwareRecommendation {
  const reqVram = Math.ceil(totalGB);
  const reqUnified = Math.ceil(totalGB / 0.9);

  // Fast (discrete): fully in VRAM. >256 GB needs a multi-GPU server.
  const gpu = pickGpu(reqVram);
  const fastDiscrete: PathResult =
    gpu != null && reqVram <= SERVER_THRESHOLD_GB
      ? { label: gpu.label, detail: `fits fully in ${gpu.vramGB} GB VRAM`, throughput: "fast" }
      : { label: SERVER_LABEL, detail: "multi-GPU server (no single GPU fits)", throughput: "server-class" };

  // Offloaded (discrete): 24 GB GPU + spillover to system RAM (only when > 24 GB).
  const offloadedDiscrete: PathResult | null =
    totalGB > OFFLOAD_GPU_VRAM
      ? {
          label: OFFLOAD_GPU,
          detail: `${OFFLOAD_GPU_VRAM} GB GPU + ${Math.ceil(totalGB - OFFLOAD_GPU_VRAM)} GB system RAM`,
          throughput: "usable",
        }
      : null;

  // Unified (Mac): minimum unified = ceil(totalGB / 0.90), then nearest Mac tier.
  const mac = pickMac(reqUnified);
  const unifiedMac: PathResult =
    mac != null && reqUnified <= SERVER_THRESHOLD_GB
      ? { label: mac.label, detail: `${mac.unifiedGB} GB unified memory`, throughput: "usable" }
      : {
          label: "No single Mac fits",
          detail: `needs ${reqUnified} GB unified — use a multi-GPU server`,
          throughput: "server-class",
        };

  return { fastDiscrete, offloadedDiscrete, unifiedMac };
}

// Re-export for UIs that build a HardwareConfig from a chosen mode.
export type { MemoryMode };
