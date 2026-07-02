import { NextResponse } from "next/server";
import { syncCatalog } from "@/lib/sync";
import { config } from "@/lib/config";

// Sync is a long-ish operation (sequential HF API calls). Allow up to 60s on Vercel.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

async function runSync() {
  try {
    const result = await syncCatalog();
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
  return runSync();
}

// GET /api/sync — Vercel Cron trigger. Vercel Cron can only send GET (no custom
// headers), so we authenticate via its documented `vercel-cron` user-agent.
// The endpoint still requires SYNC_SECRET to be configured (feature must be intentional).
export async function GET(req: Request) {
  if (!config.syncSecret) {
    return NextResponse.json({ error: "SYNC_SECRET is not configured on the server." }, { status: 500 });
  }
  const ua = req.headers.get("user-agent") ?? "";
  if (!ua.includes("vercel-cron")) {
    return NextResponse.json({ error: "Unauthorized — use POST with x-sync-secret." }, { status: 401 });
  }
  return runSync();
}
