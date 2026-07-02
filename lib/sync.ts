// Hugging Face catalog sync (spec §6 + roster discovery). Server-only.
// `runSync()` = discover popular models from the HF list, then refresh any
// catalog models not covered by discovery (per-model fetch). Failures are
// non-fatal: a failed fetch keeps the last good value.

import { prisma } from "./prisma";
import { config } from "./config";
import { discoverModels } from "./discover";

export interface SyncError {
  repo: string;
  reason: string;
}

export interface SyncResult {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
  discovered: number;
  added: number;
  success: number;
  failed: number;
  skipped: number;
  errors: SyncError[];
}

const HF_BASE = "https://huggingface.co/api/models";
const REQUEST_TIMEOUT_MS = 15_000;
const INTER_REQUEST_DELAY_MS = 200;

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeGated(g: unknown): boolean {
  if (g === true) return true;
  if (typeof g === "string") return g !== "false" && g !== "";
  return false;
}

interface FetchResult {
  ok: boolean;
  status: number;
  data?: {
    safetensors?: { total?: number } | null;
    gated?: unknown;
    createdAt?: string;
    downloads?: number;
    likes?: number;
  };
}

async function fetchHfModel(repo: string, token: string): Promise<FetchResult> {
  // The plain endpoint returns safetensors.total, downloads, likes, gated and
  // createdAt by default. (Using expand[]=… actually hides downloads/likes.)
  const url = `${HF_BASE}/${repo}`;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (token) headers.Authorization = `Bearer ${token}`;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, { headers, signal: ctrl.signal, cache: "no-store" });
    if (!res.ok) return { ok: false, status: res.status };
    const data = (await res.json()) as FetchResult["data"];
    return { ok: true, status: res.status, data };
  } catch (e) {
    return { ok: false, status: e instanceof Error && e.name === "AbortError" ? 408 : 0 };
  } finally {
    clearTimeout(timer);
  }
}

// Refresh catalog models whose repo is NOT in `skipRepos` (i.e. not already
// handled by discovery). Captures total + popularity + gated + createdAt.
export async function syncCatalog(
  token: string,
  skipRepos?: Set<string>,
): Promise<{ success: number; failed: number; skipped: number; errors: SyncError[] }> {
  const models = await prisma.model.findMany({ orderBy: { id: "asc" } });
  let success = 0;
  let failed = 0;
  let skipped = 0;
  const errors: SyncError[] = [];

  for (const m of models) {
    if (skipRepos?.has(m.repo)) {
      skipped++;
      continue;
    }
    try {
      const r = await fetchHfModel(m.repo, token);
      if (!r.ok) {
        if (r.status === 403) {
          skipped++;
          errors.push({ repo: m.repo, reason: "403 gated (needs HF_TOKEN)" });
        } else if (r.status === 404) {
          failed++;
          errors.push({ repo: m.repo, reason: "404 not found — kept prior value" });
        } else {
          failed++;
          errors.push({ repo: m.repo, reason: `HTTP ${r.status || "network error"}` });
        }
      } else {
        const total = r.data?.safetensors?.total;
        if (total == null || !isFinite(total)) {
          failed++;
          errors.push({ repo: m.repo, reason: "no safetensors.total exposed" });
        } else {
          const totalB = Math.round((total / 1e9) * 10) / 10;
          await prisma.model.update({
            where: { id: m.id },
            data: {
              totalParams: totalB,
              gated: normalizeGated(r.data?.gated),
              createdAt: r.data?.createdAt ? new Date(r.data.createdAt) : null,
              downloads: r.data?.downloads ?? 0,
              likes: r.data?.likes ?? 0,
              lastSyncedAt: new Date(),
            },
          });
          success++;
        }
      }
    } catch (e) {
      failed++;
      errors.push({ repo: m.repo, reason: e instanceof Error ? e.message : String(e) });
    }
    await delay(INTER_REQUEST_DELAY_MS);
  }

  return { success, failed, skipped, errors };
}

// Full sync: discover popular models from the HF list, then refresh the rest.
export async function runSync(): Promise<SyncResult> {
  const startedAt = new Date();
  const token = config.hfToken;

  const disc = await discoverModels(token);
  const rest = await syncCatalog(token, new Set(disc.discoveredRepos));

  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - startedAt.getTime();
  const errors = [...disc.errors, ...rest.errors];

  await prisma.syncLog.create({
    data: {
      startedAt,
      finishedAt,
      success: rest.success + disc.updated,
      failed: rest.failed,
      skipped: rest.skipped,
      discovered: disc.added,
      message: errors.length
        ? errors.slice(0, 8).map((e) => `${e.repo}: ${e.reason}`).join(" | ")
        : null,
    },
  });

  return {
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs,
    discovered: disc.added,
    added: disc.added,
    success: rest.success + disc.updated,
    failed: rest.failed,
    skipped: rest.skipped,
    errors,
  };
}
