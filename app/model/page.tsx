import { getModels } from "@/lib/db";
import { ModelCalculator, type ModelInputs } from "@/components/model/model-calculator";
import { QUANTS, CONTEXT_OPTIONS, DEFAULT_QUANT, DEFAULT_CONTEXT, type Quant } from "@/lib/memory";

function str(v: string | string[] | undefined): string | undefined {
  return Array.isArray(v) ? v[0] : v;
}
function num(v: string | string[] | undefined, fallback: number): number {
  const s = str(v);
  if (!s) return fallback;
  const n = parseFloat(s);
  return isFinite(n) && n >= 0 ? n : fallback;
}

export default async function ModelPage({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const models = await getModels();

  const source = str(sp.src) === "custom" ? "custom" : "catalog";
  const qStr = str(sp.q) as Quant | undefined;
  const quant: Quant = (qStr && QUANTS.some((q) => q.value === qStr) ? qStr : DEFAULT_QUANT) as Quant;
  const cStr = num(sp.c, DEFAULT_CONTEXT);
  const contextTokens = CONTEXT_OPTIONS.some((c) => c.value === cStr) ? cStr : DEFAULT_CONTEXT;

  const initial: Partial<ModelInputs> = {
    source,
    slug: str(sp.slug) ?? models[0]?.slug,
    customName: str(sp.n) ?? "",
    customTotal: num(sp.t, 14),
    customActive: num(sp.a, 0),
    quant,
    contextTokens,
    kvCacheQuantized: str(sp.k) === "1",
  };

  return <ModelCalculator models={models} initial={initial} />;
}
