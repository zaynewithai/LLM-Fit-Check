// Manual sync entry point: `npm run sync`.
// Fetches parameter counts from Hugging Face and updates the catalog.

import { syncCatalog } from "../lib/sync";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("Syncing catalog from Hugging Face…\n");
  const r = await syncCatalog();
  const secs = (r.durationMs / 1000).toFixed(1);
  console.log(
    `\nDone in ${secs}s. ${r.success} synced, ${r.failed} failed, ${r.skipped} skipped.`,
  );
  if (r.errors.length) {
    console.log("\nIssues (non-fatal — prior values kept):");
    for (const e of r.errors) console.log(`  ${e.repo}  →  ${e.reason}`);
  }
}

main()
  .catch((e) => {
    console.error("Sync failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
