import type { MemoryMode, Verdict } from "@/lib/memory";
import { fmtGB } from "@/lib/format";

const VERDICT_COLOR: Record<Verdict, string> = {
  fast: "var(--color-fast)",
  offloaded: "var(--color-offload)",
  tight: "var(--color-offload)",
  "won't-fit": "var(--color-wontfit)",
};

// The signature element: full width = available memory; fill = the model's
// required memory, colored by verdict. In discrete mode a marker shows the
// VRAM boundary. Overflow renders as a hatched over-fill with "+X GB over".
export function BudgetBar({
  totalGB,
  availableGB,
  vramGB,
  mode,
  verdict,
}: {
  totalGB: number;
  availableGB: number;
  vramGB: number;
  mode: MemoryMode;
  verdict: Verdict;
}) {
  const avail = Math.max(availableGB, 0.001);
  const fillPct = Math.min((totalGB / avail) * 100, 100);
  const overflowGB = Math.max(totalGB - avail, 0);
  const overflow = overflowGB > 0.05;
  const color = VERDICT_COLOR[verdict];
  const showMarker = mode === "discrete" && vramGB > 0 && vramGB < avail;
  const markerPct = (vramGB / avail) * 100;

  const aria = `${verdict === "won't-fit" ? "Won't fit" : "Runs"}: needs ${fmtGB(
    totalGB,
  )} of ${fmtGB(avail)} ${mode === "discrete" ? `(${fmtGB(vramGB)} VRAM)` : "unified"}`;

  return (
    <div className="w-full">
      <div
        className="relative h-3 w-full overflow-hidden rounded-full border border-[var(--color-line)] bg-[var(--color-surface-2)]"
        role="img"
        aria-label={aria}
      >
        <div
          className="bar-fill absolute inset-y-0 left-0 rounded-full"
          style={{ width: `${fillPct}%`, background: color }}
        />
        {overflow && (
          <div
            className="hatch absolute inset-y-0 left-0 rounded-full opacity-90"
            style={{ width: `${fillPct}%` }}
            aria-hidden
          />
        )}
        {showMarker && (
          <div
            className="absolute inset-y-0 z-10 w-px bg-[var(--color-heading)]/70"
            style={{ left: `${markerPct}%` }}
            aria-hidden
          >
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[0.6rem] text-[var(--color-faint)]">
              VRAM
            </span>
          </div>
        )}
      </div>
      <div className="mt-1 flex justify-between text-[0.65rem] text-[var(--color-faint)] num">
        <span>0</span>
        <span className="hidden sm:inline">
          {mode === "discrete" ? `${fmtGB(vramGB)} VRAM` : `90% of ${fmtGB(avail)}`}
        </span>
        <span className={overflow ? "text-[var(--color-wontfit)]" : ""}>
          {overflow ? `+${fmtGB(overflowGB)} over` : fmtGB(avail)}
        </span>
      </div>
    </div>
  );
}
