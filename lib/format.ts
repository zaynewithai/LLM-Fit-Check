// Number formatting for UI readouts (pure, shared).

export function fmtGB(n: number, digits = 1): string {
  if (!isFinite(n)) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(2)} TB`;
  if (n >= 100) return `${n.toFixed(0)} GB`;
  if (n >= 10) return `${n.toFixed(1)} GB`;
  return `${n.toFixed(digits)} GB`;
}

export function fmtParams(b: number): string {
  if (b >= 1000) return `${(b / 1000).toFixed(b % 1000 === 0 ? 0 : 1)}T`;
  if (b >= 1) return `${b % 1 === 0 ? b.toFixed(0) : b.toFixed(1)}B`;
  return `${b}B`;
}

export function fmtParamLabel(total: number, active: number | null): string {
  if (active == null) return fmtParams(total);
  return `${fmtParams(total)} total · ${fmtParams(active)} active`;
}
