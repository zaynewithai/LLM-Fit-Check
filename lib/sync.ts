// Hugging Face catalog sync (spec §6). Server-only: imported only by the
// /api/sync route handler and the `npm run sync` script — never by Client Components.

import { prisma } from "./prisma";
import { config } from "./config";

export interface SyncError {
  repo: string;
  reason: string;
}

export interface SyncResult {
  startedAt: string;
  finishedAt: string;
  durationMs: number;
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
  };
}

async function fetchHfModel(repo: string, token: string): Promise<FetchResult> {
  const url = `${HF_BASE}/${repo}?expand[]=safetensors&expand[]=gated&expand[]=createdAt`;
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

export async function syncCatalog(): Promise<SyncResult> {
  const startedAt = new Date();
  const token = config.hfToken;
  const models = await prisma.model.findMany({ orderBy: { id: "asc" } });

  let success = 0;
  let failed = 0;
  let skipped = 0;
  const errors: SyncError[] = [];

  for (const m of models) {
    try {
      const r = await fetchHfModel(m.repo, token);
      if (!r.ok) {
        // 403 = gated repo we can't access (skip); everything else = failed fetch.
        if (r.status === 403) {
          skipped++;
          errors.push({ repo: m.repo, reason: "403 gated (needs HF_TOKEN)" });
        } else if (r.status === 404) {
          failed++;
          errors.push({ repo: m.repo, reason: "404 not found — kept seeded value" });
        } else {
          failed++;
          errors.push({ repo: m.repo, reason: `HTTP ${r.status || "network error"}` });
        }
        // keep prior value — do not touch the row
      } else {
        const total = r.data?.safetensors?.total;
        if (total == null || !isFinite(total)) {
          failed++;
          errors.push({ repo: m.repo, reason: "no safetensors.total exposed" });
        } else {
          const totalB = Math.round((total / 1e9) * 10) / 10;
          const gated = normalizeGated(r.data?.gated);
          const createdAt = r.data?.createdAt ? new Date(r.data.createdAt) : null;
          await prisma.model.update({
            where: { id: m.id },
            data: { totalParams: totalB, gated, createdAt, lastSyncedAt: new Date() },
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

  const finishedAt = new Date();
  const durationMs = finishedAt.getTime() - startedAt.getTime();

  await prisma.syncLog.create({
    data: {
      startedAt,
      finishedAt,
      success,
      failed,
      skipped,
      message: errors.length
        ? errors
            .slice(0, 8)
            .map((e) => `${e.repo}: ${e.reason}`)
            .join(" | ")
        : null,
    },
  });

  return {
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs,
    success,
    failed,
    skipped,
    errors,
  };
}
