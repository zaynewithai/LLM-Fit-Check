import type { CatalogModel } from "@/lib/types";

// Reference table of ALL models with their raw parameter data from Hugging Face.
// Users can look up total/active params to plug into the manual calculator.
export function ParamsTable({ models }: { models: CatalogModel[] }) {
  const sorted = [...models].sort((a, b) => b.downloads - a.downloads);

  return (
    <div className="rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]/60 p-4 sm:p-6">
      <h2 className="text-lg font-semibold text-[var(--color-heading)]">Model parameters reference</h2>
      <p className="mt-1 text-sm text-[var(--color-muted)]">
        Raw parameter counts (auto-synced from Hugging Face). Use these in the manual calculator above.
      </p>

      <div className="mt-4 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--color-line)] text-left text-[0.7rem] uppercase tracking-wider text-[var(--color-muted)]">
              <th className="py-2 pr-3 font-medium">Model</th>
              <th className="py-2 pr-3 font-medium">Family</th>
              <th className="py-2 pr-3 text-right font-medium">Total (B)</th>
              <th className="py-2 pr-3 text-right font-medium">Active (B)</th>
              <th className="py-2 pr-3 font-medium">Type</th>
              <th className="py-2 pr-3 text-right font-medium">Downloads</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((m) => (
              <tr key={m.slug} className="border-b border-[var(--color-line)]/50 hover:bg-[var(--color-surface-2)]/40">
                <td className="py-1.5 pr-3">
                  <a
                    href={`/model/${m.slug}`}
                    className="font-medium text-[var(--color-heading)] hover:text-[var(--color-accent)]"
                  >
                    {m.name}
                  </a>
                </td>
                <td className="py-1.5 pr-3 text-[var(--color-faint)]">{m.family}</td>
                <td className="num py-1.5 pr-3 text-right font-semibold text-[var(--color-heading)]">{m.totalParams}</td>
                <td className="num py-1.5 pr-3 text-right text-[var(--color-muted)]">
                  {m.activeParams != null ? m.activeParams : "—"}
                </td>
                <td className="py-1.5 pr-3 text-[var(--color-faint)]">{m.isMoE ? "MoE" : "dense"}</td>
                <td className="num py-1.5 pr-3 text-right text-[var(--color-faint)]">
                  {m.downloads > 0 ? m.downloads.toLocaleString() : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[0.7rem] text-[var(--color-faint)]">
        {sorted.length} models · sorted by popularity · param counts from Hugging Face safetensors metadata
      </p>
    </div>
  );
}
