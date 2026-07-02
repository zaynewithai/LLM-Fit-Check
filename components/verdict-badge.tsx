import type { Verdict } from "@/lib/memory";

const MAP: Record<Verdict, { label: string; color: string }> = {
  fast: { label: "Runs fast", color: "var(--color-fast)" },
  offloaded: { label: "Runs offloaded", color: "var(--color-offload)" },
  tight: { label: "Runs tight", color: "var(--color-offload)" },
  "won't-fit": { label: "Won't fit", color: "var(--color-wontfit)" },
};

export function VerdictBadge({ verdict, size = "sm" }: { verdict: Verdict; size?: "sm" | "xs" }) {
  const { label, color } = MAP[verdict];
  const pad = size === "xs" ? "px-1.5 py-0.5 text-[0.65rem]" : "px-2 py-0.5 text-[0.7rem]";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded font-semibold ${pad}`}
      style={{
        background: `color-mix(in srgb, ${color} 16%, transparent)`,
        color,
        border: `1px solid color-mix(in srgb, ${color} 32%, transparent)`,
      }}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: color }} />
      {label}
    </span>
  );
}
