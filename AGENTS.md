<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Project: LLM Fit Finder

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build (Turbopack)
- `npm run lint` — ESLint (flat config)
- `npm run typecheck` — `tsc --noEmit`
- `npm test` — run vitest unit tests
- `npm run seed` — seed the model catalog into the DB
- `npm run sync` — sync parameter counts from Hugging Face
- `npm run prisma:push` — apply schema to DB (SQLite local: creates dev.db)

## Stack notes
- Next.js 16 (App Router, Turbopack default, React 19). All request APIs (`params`, `searchParams`, `headers`, `cookies`) are async — `await` them.
- Tailwind v4: theme tokens live in `app/globals.css` via `@theme {}`. No `tailwind.config.js`.
- Prisma 6 (pinned; NOT 7 — v7's driver-adapter model breaks the spec's "zero-config SQLite" requirement). Schema `url` stays in `prisma/schema.prisma`. Switching SQLite↔Postgres = change `provider` + `DATABASE_URL`.
- `lib/memory.ts` and `lib/hardware.ts` are pure modules (no Prisma, no server-only) — safe to import in client components.
- `lib/prisma.ts`, `lib/config.ts`, `lib/sync.ts`, `lib/db.ts` are server-only.

