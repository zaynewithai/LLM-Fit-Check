# Build progress — LLM Fit Finder

## Phase 1 — Scaffold ✅
- Next.js 16 (App Router, Turbopack) + TypeScript + React 19 + Tailwind v4
- Prisma 6 pinned (v7 driver-adapter model breaks the "zero-config SQLite" requirement); SQLite `dev.db` created via `prisma db push`
- Theme: "Precision Instrument" — deep blue-slate, teal/amber/coral verdict colors, periwinkle accent; Chakra Petch / IBM Plex Sans / IBM Plex Mono
- Root layout + site header + landing page (`/`); `.env.example` + typed `lib/config.ts` + Prisma client singleton
- Scripts: seed, sync, test, typecheck, lint, prisma:push/generate
- `npm run build`, `lint`, `typecheck` all green

## Phase 2 — Data + seed ✅
- Prisma schema (`Model` + `SyncLog`) applied; SQLite `dev.db` in sync
- `lib/seed-data.ts` = the 31-model catalog (single editable file); `prisma/seed.ts` upserts by repo, non-destructive on re-seed
- `npm run seed` → 31 models, 14 MoE (verified: GLM-5.2 744B/40B, Kimi K2 1000B/32B)
## Phase 3 — Engine ✅
- `lib/memory.ts` (pure): footprint (weights/KV/overhead), verdict (discrete fast/offloaded/won't-fit · unified fast/tight/won't-fit), summary buckets
- `lib/hardware.ts` (pure): GPU + Mac ladders → named hardware, offload path, throughput bucket
- 19 vitest unit tests, all green
- **Spec discrepancy noted:** the §5.1 formula (source of truth) gives 744B @ Q4 = ~442 GB; the DoD's "≈235 GB" actually matches Q2 (~228 GB). Tests assert formula-exact values + the Q2 ≈235 case.
## Phase 4 — Mode A UI ⏳
## Phase 5 — Mode B UI ⏳
## Phase 6 — Catalog + filters + detail ⏳
## Phase 7 — Sync engine (HF → DB) ⏳
## Phase 8 — Scheduling + deploy (vercel.json, Dockerfile, README) ⏳
## Phase 9 — Polish ⏳
