import { computeFootprint, QUANTS, DEFAULT_CONTEXT } from "@/lib/memory";
import { recommendHardware, THROUGHPUT_LABELS } from "@/lib/hardware";
import { fmtGB } from "@/lib/format";

// Per-quant memory table at 32K context, no KV quantization.
// Shows footprint breakdown + the smallest discrete hardware that runs it fast.
export function PerQuantTable({
  totalParams,
  activeParams,
}: {
  totalParams: number;
  activeParams: number | null;
}) {
  const rows = QUANTS.map((q) => {
    const f = computeFootprint({
      totalParamsB: totalParams,
      activeParamsB: activeParams,
      quant: q.value,
      contextTokens: DEFAULT_CONTEXT,
      kvCacheQuantized: false,
    });
    const rec = recommendHardware(f.totalGB);
    return { q, f, rec };
  });

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-[var(--color-line)] text-left text-[0.7rem] uppercase tracking-wider text-[var(--color-muted)]">
            <th className="py-2 pr-3 font-medium">Quant</th>
            <th className="py-2 pr-3 text-right font-medium">Weights</th>
            <th className="py-2 pr-3 text-right font-medium">KV</th>
            <th className="py-2 pr-3 text-right font-medium">Overhead</th>
            <th className="py-2 pr-3 text-right font-medium">Total</th>
            <th className="py-2 pr-3 font-medium">Smallest hardware (fast)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ q, f, rec }) => (
            <tr key={q.value} className="border-b border-[var(--color-line)]/60">
              <td className="py-2 pr-3 font-semibold uppercase text-[var(--color-heading)]">{q.label}</td>
              <td className="num py-2 pr-3 text-right text-[var(--color-muted)]">{fmtGB(f.weightsGB)}</td>
              <td className="num py-2 pr-3 text-right text-[var(--color-muted)]">{fmtGB(f.kvGB)}</td>
              <td className="num py-2 pr-3 text-right text-[var(--color-muted)]">{fmtGB(f.overheadGB)}</td>
              <td className="num py-2 pr-3 text-right font-semibold text-[var(--color-heading)]">{fmtGB(f.totalGB)}</td>
              <td className="py-2 pr-3">
                <div className="text-[var(--color-ink)]">{rec.fastDiscrete.label}</div>
                <div className="num text-[0.65rem] text-[var(--color-faint)]">
                  {THROUGHPUT_LABELS[rec.fastDiscrete.throughput]}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[0.65rem] text-[var(--color-faint)]">
        At {DEFAULT_CONTEXT / 1000}K context, no KV quantization. Overhead is 15% of weights + KV.
      </p>
    </div>
  );
}
