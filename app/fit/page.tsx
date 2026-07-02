import { getModels } from "@/lib/db";
import { FitCalculator, type FitInputs } from "@/components/fit/fit-calculator";
import { QUANTS, CONTEXT_OPTIONS, DEFAULT_QUANT, DEFAULT_CONTEXT, type Quant, type MemoryMode } from "@/lib/memory";

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
function num(v: string | string[] | undefined, fallback: number): number {
  const s = str(v);
  if (!s) return fallback;
  const n = parseFloat(s);
  return isFinite(n) && n >= 0 ? n : fallback;
}

export default async function FitPage({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;

  const mode: MemoryMode = str(sp.m) === "unified" ? "unified" : "discrete";
  const qStr = str(sp.q) as Quant | undefined;
  const quant: Quant = (qStr && QUANTS.some((q) => q.value === qStr) ? qStr : DEFAULT_QUANT) as Quant;
  const cStr = num(sp.c, DEFAULT_CONTEXT);
  const contextTokens = CONTEXT_OPTIONS.some((c) => c.value === cStr) ? cStr : DEFAULT_CONTEXT;

  const initial: Partial<FitInputs> = {
    mode,
    vram: num(sp.v, 24),
    ram: num(sp.r, 64),
    unified: num(sp.u, 64),
    quant,
    contextTokens,
    kvCacheQuantized: str(sp.k) === "1",
  };

  const models = await getModels();

  return <FitCalculator models={models} initial={initial} />;
}
