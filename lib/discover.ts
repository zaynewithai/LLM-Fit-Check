// HF model discovery (spec extension: the model roster comes from Hugging Face,
// sorted by popularity). Server-only.
//
// Fetches the top text-generation models from HF sorted by downloads, filters to
// canonical publishers and a sane LLM parameter range, and upserts them with
// popularity (downloads/likes), exact total params, gated, and createdAt.
// `lib/seed-data.ts` is used as an enrichment override for MoE active params,
// family, and friendly names (HF does not expose active params for MoE).

import { prisma } from "./prisma";
import { SEED_OVERRIDE } from "./seed-data";
import { slugify } from "./slug";

const HF_LIST = "https://huggingface.co/api/models";
const PAGE_LIMIT = 100;
const MAX_PAGES = 12; // up to 1200 raw results scanned
const TARGET = 70; // stop once this many qualifying models are found
const DELAY_MS = 150;
const REQUEST_TIMEOUT_MS = 20_000;

// Canonical open-LLM publishers. Filters out fine-tunes / merges / quant repos
// from the popularity-sorted list.
const PUBLISHERS = new Set([
  "Qwen", "meta-llama", "google", "mistralai", "deepseek-ai", "microsoft",
  "openai", "openai-community", "moonshotai", "zai-org", "MiniMaxAI", "THUDM",
  "NVIDIA", "nvidia", "allenai", "CohereForAI", "Alibaba-PAI", "Skywork",
  "01-ai", "baichuan-inc", "internlm", "Tele-AI", "inclusionAI", "tencent",
]);

const FAMILY_BY_AUTHOR: Record<string, string> = {
  Qwen: "Qwen", "meta-llama": "Llama", google: "Gemma", mistralai: "Mistral",
  "deepseek-ai": "DeepSeek", microsoft: "Phi", openai: "OpenAI",
  "openai-community": "OpenAI", moonshotai: "Moonshot", "zai-org": "Z.ai",
  MiniMaxAI: "MiniMax", THUDM: "GLM", NVIDIA: "NVIDIA", nvidia: "NVIDIA",
  allenai: "OLMo", CohereForAI: "Cohere", "Alibaba-PAI": "Qwen", Skywork: "Skywork",
  "01-ai": "Yi", "baichuan-inc": "Baichuan", internlm: "InternLM",
  "Tele-AI": "TeleAI", inclusionAI: "GPT-OSS", tencent: "Tencent",
};

const MIN_PARAMS_B = 0.5;
const MAX_PARAMS_B = 2000;
const QUANT_REPO = /(\b|[-_])(gguf|gptq|awq|exl2|exl3|int4|int8|fp8|w4a16|bnb|ptb)(\b|[-_])/i;

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeGated(g: unknown): boolean {
  if (g === true) return true;
  if (typeof g === "string") return g !== "false" && g !== "";
  return false;
}

function deriveName(repo: string): string {
  const last = repo.split("/").pop() ?? repo;
  return last
    .replace(/[-_]/g, " ")
    .replace(/\bIt\b/i, "Instruct")
    .replace(/\s+/g, " ")
    .trim();
}

interface ListItem {
  id: string; // "org/name"
  author?: string;
  downloads?: number;
  likes?: number;
  gated?: unknown;
  createdAt?: string;
  safetensors?: { total?: number } | null;
}

async function fetchPage(offset: number, token: string): Promise<ListItem[]> {
  const url =
    `${HF_LIST}?filter=text-generation&sort=downloads&direction=-1` +
    `&expand[]=safetensors&expand[]=gated&limit=${PAGE_LIMIT}&offset=${offset}`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers, signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) throw new Error(`HF list HTTP ${res.status}`);
    return (await res.json()) as ListItem[];
  } finally {
    clearTimeout(timer);
  }
}

export interface DiscoverResult {
  discoveredRepos: string[];
  added: number;
  updated: number;
  errors: { repo: string; reason: string }[];
}

export async function discoverModels(token: string): Promise<DiscoverResult> {
  const discoveredRepos: string[] = [];
  let added = 0;
  let updated = 0;
  const errors: { repo: string; reason: string }[] = [];
  let qualifying = 0;

  for (let page = 0; page < MAX_PAGES && qualifying < TARGET; page++) {
    let items: ListItem[];
    try {
      items = await fetchPage(page * PAGE_LIMIT, token);
    } catch (e) {
      errors.push({ repo: "(list page " + page + ")", reason: e instanceof Error ? e.message : String(e) });
      break;
    }
    if (!items.length) break;

    for (const it of items) {
      const repo = it.id;
      const author = it.author ?? repo.split("/")[0];
      if (!PUBLISHERS.has(author)) continue;
      if (QUANT_REPO.test(repo)) continue;
      const total = it.safetensors?.total;
      if (total == null || !isFinite(total)) continue;
      const totalB = Math.round((total / 1e9) * 10) / 10;
      if (totalB < MIN_PARAMS_B || totalB > MAX_PARAMS_B) continue;

      qualifying++;
      discoveredRepos.push(repo);

      const ov = SEED_OVERRIDE[repo];
      const name = ov?.name ?? deriveName(repo);
      const family = ov?.family ?? (FAMILY_BY_AUTHOR[author] ?? author);
      const activeParams = ov?.activeParams ?? null;
      const isMoE = activeParams != null;
      const gated = normalizeGated(it.gated);
      const createdAt = it.createdAt ? new Date(it.createdAt) : null;
      const downloads = it.downloads ?? 0;
      const likes = it.likes ?? 0;

      try {
        const existed = await prisma.model.findUnique({ where: { repo }, select: { id: true } });
        await prisma.model.upsert({
          where: { repo },
          create: {
            slug: slugify(repo), name, repo, family, totalParams: totalB, activeParams,
            isMoE, openWeights: true, gated, downloads, likes, createdAt, lastSyncedAt: new Date(),
          },
          update: {
            name, family, totalParams: totalB, activeParams, isMoE, gated,
            downloads, likes, createdAt, lastSyncedAt: new Date(),
          },
        });
        if (existed) updated++;
        else added++;
      } catch (e) {
        errors.push({ repo, reason: e instanceof Error ? e.message : String(e) });
      }
    }
    await delay(DELAY_MS);
  }

  return { discoveredRepos, added, updated, errors };
}
