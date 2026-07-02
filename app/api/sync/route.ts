import { NextResponse } from "next/server";
import { syncCatalog } from "@/lib/sync";
import { config } from "@/lib/config";

// Sync is a long-ish operation (sequential HF API calls). Allow up to 60s on Vercel.
export const maxDuration = 60;
export const dynamic = "force-dynamic";

// POST /api/sync — refreshes the catalog from Hugging Face.
// Guarded by SYNC_SECRET: requires header `x-sync-secret: <SYNC_SECRET>`.
export async function POST(req: Request) {
  if (!config.syncSecret) {
    return NextResponse.json({ error: "SYNC_SECRET is not configured on the server." }, { status: 500 });
  }
  const provided = req.headers.get("x-sync-secret");
  if (!provided || provided !== config.syncSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

// Reject other methods explicitly.
export function GET() {
  return NextResponse.json({ error: "Use POST with x-sync-secret header." }, { status: 405 });
}
