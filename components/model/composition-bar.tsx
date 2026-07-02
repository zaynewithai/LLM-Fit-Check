import type { Footprint } from "@/lib/memory";
import { fmtGB } from "@/lib/format";

// Stacked bar showing where the memory goes: weights / KV / overhead.
export function CompositionBar({ f }: { f: Footprint }) {
  const total = Math.max(f.totalGB, 0.001);
  const segs = [
    { label: "Weights", gb: f.weightsGB, color: "var(--color-fast)" },
    { label: "KV cache", gb: f.kvGB, color: "var(--color-accent)" },
    { label: "Overhead", gb: f.overheadGB, color: "var(--color-offload)" },
  ];
  return (
    <div>
      <div className="flex h-4 w-full overflow-hidden rounded-md border border-[var(--color-line)] bg-[var(--color-surface-2)]">
        {segs.map((s) => {
          const pct = (s.gb / total) * 100;
          if (pct < 0.5) return null;
          return (
            <div
              key={s.label}
              className="bar-fill h-full"
              style={{ width: `${pct}%`, background: s.color }}
              title={`${s.label}: ${fmtGB(s.gb)}`}
            />
          );
        })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[0.7rem]">
        {segs.map((s) => (
          <span key={s.label} className="flex items-center gap-1.5 text-[var(--color-muted)]">
            <span className="inline-block h-2 w-2 rounded-sm" style={{ background: s.color }} />
            {s.label}
            <span className="num text-[var(--color-ink)]">{fmtGB(s.gb)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
