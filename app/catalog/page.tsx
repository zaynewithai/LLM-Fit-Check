import { getModels, getFamilies } from "@/lib/db";
import { CatalogExplorer } from "@/components/catalog/catalog-explorer";
import {
  type CatalogState,
  type SizeKey,
  SIZE_OPTIONS,
} from "@/components/catalog/filters";
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

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ [k: string]: string | string[] | undefined }>;
}) {
  const sp = await searchParams;
  const [models, families] = await Promise.all([getModels(), getFamilies()]);

  const zStr = str(sp.z) as SizeKey | undefined;
  const size: SizeKey = zStr && SIZE_OPTIONS.some((o) => o.value === zStr) ? zStr : "all";
  const qStr = str(sp.q) as Quant | undefined;
  const quant: Quant = (qStr && QUANTS.some((q) => q.value === qStr) ? qStr : DEFAULT_QUANT) as Quant;
  const cStr = num(sp.c, DEFAULT_CONTEXT);
  const contextTokens = CONTEXT_OPTIONS.some((c) => c.value === cStr) ? cStr : DEFAULT_CONTEXT;

  const initial: Partial<CatalogState> = {
    search: str(sp.s) ?? "",
    family: str(sp.f) ?? "all",
    size,
    arch: str(sp.a) === "dense" || str(sp.a) === "moe" ? (str(sp.a) as "dense" | "moe") : "all",
    fit: str(sp.fit) === "1",
    mode: str(sp.m) === "unified" ? "unified" : "discrete",
    vram: num(sp.v, 24),
    ram: num(sp.r, 64),
    unified: num(sp.u, 64),
    quant,
    contextTokens,
    kvCacheQuantized: str(sp.k) === "1",
    sort: str(sp.sort) === "footprint" ? "footprint" : "params",
  };

  return <CatalogExplorer models={models} families={families} initial={initial} />;
}
