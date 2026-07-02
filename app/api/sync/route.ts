import { NextResponse } from "next/server";
import { runSync } from "@/lib/sync";
import { config } from "@/lib/config";

// Sync is a long-ish operation (HF list + per-model refresh). Allow up to 60s on Vercel.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

async function runSyncHandler() {
  try {
    const result = await runSync();
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sync failed." },
      { status: 500 },
    );
  }
}

// POST /api/sync — manual / system-cron. Requires header `x-sync-secret: <SYNC_SECRET>`.
export async function POST(req: Request) {
  if (!config.syncSecret) {
    return NextResponse.json({ error: "SYNC_SECRET is not configured on the server." }, { status: 500 });
  }
  const provided = req.headers.get("x-sync-secret");
  if (!provided || provided !== config.syncSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return runSyncHandler();
}

// GET /api/sync — Vercel Cron trigger (UA `vercel-cron`, since it can't send headers).
export async function GET(req: Request) {
  if (!config.syncSecret) {
    return NextResponse.json({ error: "SYNC_SECRET is not configured on the server." }, { status: 500 });
  }
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua.includes("vercel-cron")) {
    return NextResponse.json({ error: "Unauthorized — use POST with x-sync-secret." }, { status: 401 });
  }
  return runSyncHandler();
}
