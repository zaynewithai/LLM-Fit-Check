import type { PathResult, Throughput } from "@/lib/hardware";
import { THROUGHPUT_LABELS } from "@/lib/hardware";
import { Cpu, Layers, Apple, Zap } from "lucide-react";

const TPUT_COLOR: Record<Throughput, string> = {
  fast: "var(--color-fast)",
  usable: "var(--color-offload)",
  "server-class": "var(--color-wontfit)",
};

export function HardwareCard({
  kind,
  path,
}: {
  kind: "fast" | "offloaded" | "unified";
  path: PathResult;
}) {
  const meta = {
    fast: { icon: Zap, title: "Fast (discrete)", hint: "fully in VRAM" },
    offloaded: { icon: Layers, title: "Offloaded (discrete)", hint: "24 GB GPU + RAM" },
    unified: { icon: Apple, title: "Unified (Mac)", hint: "Apple Silicon memory" },
  }[kind];
  const Icon = meta.icon;
  const color = TPUT_COLOR[path.throughput];

  return (
    <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-3 sm:p-4">
      <div className="flex items-center gap-2">
        <span className="grid h-7 w-7 place-items-center rounded-md border border-[var(--color-line-strong)] bg-[var(--color-surface-2)] text-[var(--color-accent)]">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <div className="text-[0.7rem] uppercase tracking-wider text-[var(--color-muted)]">
            {meta.title}
          </div>
          <div className="text-[0.65rem] text-[var(--color-faint)]">{meta.hint}</div>
        </div>
      </div>
      <div className="mt-3 text-sm font-semibold text-[var(--color-heading)]">{path.label}</div>
      <div className="num mt-0.5 text-[0.7rem] text-[var(--color-faint)]">{path.detail}</div>
      <div
        className="mt-2 inline-flex items-center gap-1.5 rounded px-2 py-0.5 text-[0.65rem] font-semibold"
        style={{
          background: `color-mix(in srgb, ${color} 16%, transparent)`,
          color,
        }}
      >
        <Cpu className="h-3 w-3" />
        {THROUGHPUT_LABELS[path.throughput]}
      </div>
    </div>
  );
}
