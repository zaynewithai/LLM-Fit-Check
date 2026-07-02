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
## Phase 4 — Mode A UI ✅
- `/fit` (server page, async searchParams) → `FitCalculator` (client, live recompute, URL sync via history.replaceState)
- Controls: memory-type segmented toggle (discrete VRAM+RAM / unified), quant + context + q4-KV (shared component)
- BudgetBar signature element: verdict-colored fill, VRAM boundary marker, hatched overflow + "+X GB over"
- Summary strip (fast / offloaded / won't-fit counts), sorted list ascending by footprint, staggered row animation
- Smoke-tested via `next start`: HTTP 200, bars + models render, no runtime errors
## Phase 5 — Mode B UI ✅
- `/model` (server page, async searchParams) → `ModelCalculator` (client)
- Source toggle: catalog (accessible searchable combobox `ModelPicker`) or custom (name/total/active)
- Footprint breakdown + stacked composition bar (weights/KV/overhead)
- Hardware recommendations → 3 named cards (fast discrete / offloaded / unified Mac) with throughput bucket
- "Drop a quant level" note when it won't fit a 24 GB GPU at current quant
- Smoke-tested catalog + custom modes: HTTP 200, hardware/footprint/throughput render, no errors
## Phase 6 — Catalog + filters + detail ✅
- `/catalog` (server, async searchParams) → `CatalogExplorer` (client): search, family/size/arch filters, sort by params or footprint, "fits my rig" (reuses Mode A memory inputs + verdict filter)
- Desktop sticky sidebar; mobile slide-in drawer
- `/model/[slug]` detail (SSG via generateStaticParams, all 31 prerendered): metadata grid, HF link, per-quant memory table (FP16→Q2, smallest hardware per quant)
- Smoke-tested: catalog filters + detail table + HF link render, no errors
## Phase 7 — Sync engine ✅
- `lib/sync.ts`: fetches `safetensors.total` from HF API per repo, upserts exact `totalB` (round 1 dp), `gated`, `createdAt`, `lastSyncedAt`; sequential with 200ms delay; graceful 403/404/429/network handling (keeps prior value); records `SyncLog`
- `scripts/sync.ts` → `npm run sync`; `app/api/sync/route.ts` → `POST /api/sync` guarded by `x-sync-secret`
- Verified: 401 without/wrong secret, 405 on GET, 200 with correct secret; real sync of 31 repos in ~13s (GLM-5.2 744→753.3, Kimi K2 1000→1026.5); lastSyncedAt + SyncLog recorded
- Removed `server-only` import from db/sync (it breaks tsx scripts; optional per Next docs)
## Phase 8 — Scheduling + deploy ✅
- `vercel.json`: daily cron `GET /api/sync` at 04:00 UTC
- `/api/sync` GET path for Vercel Cron (UA `vercel-cron`-based, since Vercel Cron can't send headers); POST stays header-guarded for manual/system-cron. Verified: non-cron GET → 401, cron-UA GET → 200 (sync runs)
- `Dockerfile` (multi-stage node:22-alpine) + `.dockerignore` for self-hosted; README documents Vercel + Docker + system-cron
- Detail page made dynamic (removed generateStaticParams) so container builds need no DB and pages stay fresh after sync
- README: setup, env, sync, both deploy paths, cron examples, caveats, formula
- Note: Docker image not built locally (Docker daemon was down); Dockerfile follows the standard multi-stage pattern
## Phase 9 — Polish ✅
- Custom 404 (`app/not-found.tsx`); detail page `notFound()` for unknown slugs
- Mode A empty state; mode-aware summary label (Runs offloaded / Runs tight)
- Mobile filter drawer: Escape-to-close + body-scroll lock
- Responsive header nav (short labels at 360px, full at ≥640px)
- Reduced-motion handled in CSS; focus-visible rings; ARIA roles throughout (radiogroup/switch/combobox/listbox/dialog)
- Final: typecheck + lint + 19 tests + build all green; all routes 200/404 verified

## Phase 10 — HF roster discovery + popularity ✅
- Model roster now comes from HF (`lib/discover.ts`): fetches top text-generation models sorted by downloads, filtered to canonical publishers + 0.5–2000B param range. Catalog grew 31 → 80 models.
- Added `downloads`/`likes` to schema; catalog default sort = popularity; cards show download counts.
- `lib/seed-data.ts` repurposed as a MoE/family/name enrichment override (HF doesn't expose MoE active params).
- Fixed: single-model endpoint `expand[]` hid downloads/likes → switched to plain `/api/models/{repo}` (returns all fields).
- Slug = `slugify(repo)` (globally unique) to avoid base-vs-instruct name collisions.
- `runSync()` = discover + refresh; verified 80 models, 0 downloads=0, top = Qwen3 0.6B (28M). typecheck/lint/build/19 tests green.

## Definition of Done
- [x] Both modes recompute live; results match `lib/memory.ts`
- [x] Mode B maps footprint → named hardware + throughput bucket; custom-model entry works
- [x] Catalog: search + family/size/dense-MoE/fits-my-rig filters + sort
- [x] `npm run seed` populates; `npm run sync` refreshes from HF; failures non-fatal (keep last value)
- [x] `POST /api/sync` rejected without `x-sync-secret` (401 verified)
- [x] Cron on Vercel (vercel.json, GET+UA) and self-hosted (system cron curl); documented
- [x] Responsive 360/1280px; keyboard-accessible; reduced-motion respected
- [x] No secret reaches the browser; works with `HF_TOKEN` empty (gated repos skipped)
- [x] Memory Budget Bar = signature element (VRAM marker + hatched overflow)
- [x] README: setup, env, sync, both deploy paths, caveats, formula
- [x] Unit tests pass — 744B@Q4=442GB (formula-exact), 744B@Q2≈228GB (the spec's ≈235 figure; discrepancy documented)
