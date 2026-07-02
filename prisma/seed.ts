// Seed the model catalog from lib/seed-data.ts into the database.
// Idempotent: upserts by `repo`. On update it refreshes metadata only and
// never overwrites values owned by the sync job (total, gated, timestamps).
// Run with: npm run seed

import { PrismaClient } from "@prisma/client";
import { SEED_MODELS } from "../lib/seed-data";

const prisma = new PrismaClient();

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function main() {
  console.log(`Seeding ${SEED_MODELS.length} models…`);
  let created = 0;
  let updated = 0;

  for (const m of SEED_MODELS) {
    const isMoE = m.active != null;
    const result = await prisma.model.upsert({
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
      update: {
        // refresh metadata only — leave total/gated/timestamps to the sync job
        name: m.name,
        family: m.family,
        activeParams: m.active,
        isMoE,
      },
    });
    if (result.lastSyncedAt == null) created++;
    else updated++;
  }

  console.log(`Done. ${created} created, ${updated} already synced (metadata refreshed).`);
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
