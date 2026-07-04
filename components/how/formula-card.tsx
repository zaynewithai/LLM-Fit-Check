import { QUANTS } from "@/lib/memory";

// Renders the calculation formula (spec §5) as a reference card.
// Static — no interactivity, just shows the math.
export function FormulaCard() {
  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-[var(--color-heading)]">The formula</h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Every number on this site comes from these equations (spec §5, the source of truth).
      </p>

      <div className="mt-5 space-y-4">
        <FormulaRow
          num="1"
          label="Weights"
          formula="totalParams × bitsPerWeight[quant] ÷ 8"
          unit="GB"
          color="var(--color-fast)"
        />
        <FormulaRow
          num="2"
          label="KV cache"
          formula="clamp(0.5 × √(attnParams ÷ 70), 0.03, 0.9) × (context ÷ 1000)"
          unit="GB"
          color="var(--color-accent)"
          note="÷ 4 if q4 KV cache. attnParams = active (MoE) or total (dense)"
        />
        <FormulaRow
          num="3"
          label="Overhead"
          formula="0.15 × (weights + kv)"
          unit="GB"
          color="var(--color-offload)"
        />
        <FormulaRow
          num="4"
          label="Total"
          formula="weights + kv + overhead"
          unit="GB"
          color="var(--color-heading)"
          bold
        />
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)]/50 p-3">
          <p className="eyebrow mb-2">bits per weight</p>
          <div className="grid grid-cols-4 gap-1.5 text-xs num">
            {QUANTS.map((q) => (
              <div key={q.value} className="flex items-center justify-between rounded bg-[var(--color-surface)] px-2 py-1">
                <span className="font-semibold text-[var(--color-heading)]">{q.label}</span>
                <span className="text-[var(--color-muted)]">{q.bits}b</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)]/50 p-3">
          <p className="eyebrow mb-2">verdict logic</p>
          <ul className="space-y-1 text-xs text-[var(--color-muted)]">
            <li><span className="text-[var(--color-fast)] font-semibold">Fast</span> — total ≤ VRAM (discrete) or ≤ 90% (unified)</li>
            <li><span className="text-[var(--color-offload)] font-semibold">Offloaded</span> — total ≤ VRAM + RAM</li>
            <li><span className="text-[var(--color-offload)] font-semibold">Tight</span> — total ≤ 100% unified</li>
            <li><span className="text-[var(--color-wontfit)] font-semibold">Won&apos;t fit</span> — exceeds available memory</li>
          </ul>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-2)]/50 p-3 text-xs text-[var(--color-muted)]">
        <p className="font-semibold text-[var(--color-heading)]">Worked example — Qwen3 8B @ Q4, 32K context:</p>
        <p className="mt-1.5 num">
          weights = 8 × 4 ÷ 8 = 4.00 GB<br/>
          attnParams = 8 (dense) → kvPer1k = clamp(0.5 × √(8÷70), 0.03, 0.9) = 0.338<br/>
          kv = 0.338 × 32.768 = 11.08 GB<br/>
          overhead = 0.15 × (4.00 + 11.08) = 2.26 GB<br/>
          <span className="font-semibold text-[var(--color-heading)]">total = 17.34 GB</span>
        </p>
      </div>
    </div>
  );
}

function FormulaRow({
  num,
  label,
  formula,
  unit,
  color,
  note,
  bold,
}: {
  num: string;
  label: string;
  formula: string;
  unit: string;
  color: string;
  note?: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <span
        className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold"
        style={{ background: `color-mix(in srgb, ${color} 18%, transparent)`, color }}
      >
        {num}
      </span>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className={`text-sm ${bold ? "font-bold text-[var(--color-heading)]" : "font-semibold text-[var(--color-heading)]"}`}>{label}</span>
          <span className="text-[0.65rem] uppercase text-[var(--color-faint)]">{unit}</span>
        </div>
        <p className="num mt-0.5 text-sm text-[var(--color-ink)]">{formula}</p>
        {note && <p className="mt-0.5 text-[0.7rem] text-[var(--color-faint)]">{note}</p>}
      </div>
    </div>
  );
}
