// One-shot: migrate + seed + sync the Vercel Postgres database.
// Run locally with the Postgres DATABASE_URL set:
//   DATABASE_URL="postgresql://..." npx tsx scripts/setup-postgres.ts
//
// This is safe to run repeatedly (idempotent upserts). Do NOT run against SQLite.

import { PrismaClient } from "@prisma/client";
import { execSync } from "node:child_process";
import { SEED_MODELS } from "../lib/seed-data";
import { slugify } from "../lib/slug";

function assertPostgres() {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.startsWith("postgresql://") && !url.startsWith("postgres://")) {
    console.error("DATABASE_URL must be a PostgreSQL URL to run this script.");
    console.error("Got:", url.slice(0, 40) + "…");
    process.exit(1);
  }
}

async function main() {
  assertPostgres();

  console.log("→ Running prisma db push (create/apply schema)…");
  execSync("npx prisma db push --skip-generate --accept-data-loss", {
    stdio: "inherit",
    env: process.env,
  });

  const prisma = new PrismaClient();
  try {
    console.log(`→ Seeding ${SEED_MODELS.length} models…`);
    let created = 0;
    let updated = 0;
    for (const m of SEED_MODELS) {
      const isMoE = m.active != null;
      const existed = await prisma.model.findUnique({ where: { repo: m.repo }, select: { id: true } });
      await prisma.model.upsert({
        where: { repo: m.repo },
        create: {
          slug: slugify(m.repo),
          name: m.name,
          repo: m.repo,
          family: m.family,
          totalParams: m.total,
          activeParams: m.active,
          isMoE,
          openWeights: true,
          gated: false,
        },
        update: { name: m.name, family: m.family, activeParams: m.active, isMoE },
      });
      if (existed) updated++;
      else created++;
    }
    console.log(`  ${created} created, ${updated} updated.`);

    console.log("→ Discovering + syncing from Hugging Face (this takes ~15-30s)…");
    const { runSync } = await import("../lib/sync");
    const r = await runSync();
    console.log(
      `  Done in ${(r.durationMs / 1000).toFixed(1)}s.`,
      `${r.discovered} new discovered, ${r.success} refreshed, ${r.failed} failed, ${r.skipped} skipped.`,
    );
    if (r.errors.length) {
      console.log("  Issues (non-fatal):");
      for (const e of r.errors.slice(0, 10)) console.log(`    ${e.repo} → ${e.reason}`);
    }

    const count = await prisma.model.count();
    console.log(`\n✓ Postgres ready. ${count} models in the catalog.`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error("Setup failed:", e);
  process.exitCode = 1;
});
