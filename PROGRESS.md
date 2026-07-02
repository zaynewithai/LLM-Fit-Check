# Build progress — LLM Fit Finder

## Phase 1 — Scaffold ✅
- Next.js 16 (App Router, Turbopack) + TypeScript + React 19 + Tailwind v4
- Prisma 6 pinned (v7 driver-adapter model breaks the "zero-config SQLite" requirement); SQLite `dev.db` created via `prisma db push`
- Theme: "Precision Instrument" — deep blue-slate, teal/amber/coral verdict colors, periwinkle accent; Chakra Petch / IBM Plex Sans / IBM Plex Mono
- Root layout + site header + landing page (`/`); `.env.example` + typed `lib/config.ts` + Prisma client singleton
- Scripts: seed, sync, test, typecheck, lint, prisma:push/generate
- `npm run build`, `lint`, `typecheck` all green

## Phase 2 — Data + seed ⏳
## Phase 3 — Engine (lib/memory.ts + lib/hardware.ts + tests) ⏳
## Phase 4 — Mode A UI ⏳
## Phase 5 — Mode B UI ⏳
## Phase 6 — Catalog + filters + detail ⏳
## Phase 7 — Sync engine (HF → DB) ⏳
## Phase 8 — Scheduling + deploy (vercel.json, Dockerfile, README) ⏳
## Phase 9 — Polish ⏳
