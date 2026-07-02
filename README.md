# LLM Fit Finder

A single-purpose tool for **open-weight LLMs** (no closed models). It answers two questions:

1. **Hardware → Models** — *"I have this hardware, which open LLMs can I run, and how well?"*
2. **Model → Hardware** — *"I want to run this model, what hardware do I need?"*

Plus a filterable catalog with a per-model detail view, and a self-updating engine that syncs exact parameter counts from Hugging Face.

All UI is in English, mobile-first, and centered on one signature element: the **Memory Budget Bar**.

---

## Stack

- **Next.js 16** (App Router, Turbopack, React 19) + **TypeScript**
- **Tailwind CSS v4** (theme tokens in `app/globals.css`)
- **Prisma 6** + **PostgreSQL** (primary) or **SQLite** (zero-config local fallback)
- **Vitest** for the calculation-engine unit tests
- Hugging Face API for parameter-count sync (no key required for public models)

## Quick start (local, SQLite — zero config)

```bash
# 1. Install
npm install            # postinstall runs `prisma generate`

# 2. Configure env
cp .env.example .env   # then edit .env: set SYNC_SECRET (any long random string)

# 3. Create the DB + seed the catalog
npm run prisma:push    # creates dev.db (SQLite) and applies the schema
npm run seed           # inserts the 31 open-weight models

# 4. (Optional) refresh exact param counts from Hugging Face
npm run sync

# 5. Run
npm run dev            # http://localhost:3000
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | Postgres: `postgresql://user:pass@host:5432/llmfit?schema=public` · SQLite (local): `file:./dev.db` |
| `SYNC_SECRET` | yes | Long random string. `POST /api/sync` requires the `x-sync-secret: <SYNC_SECRET>` header. |
| `HF_TOKEN` | no | Hugging Face token. Only needed to sync **gated** repos (some Meta/Google releases). Leave empty for public repos. Never sent to the browser. |
| `NEXT_PUBLIC_APP_NAME` | no | App name shown in the UI. Defaults to "LLM Fit Finder". |

> Switching SQLite ↔ Postgres is a one-line change: set `provider` in `prisma/schema.prisma` **and** `DATABASE_URL`.

## Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (Turbopack) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint (flat config) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Run Vitest unit tests |
| `npm run seed` | Seed the model catalog into the DB |
| `npm run sync` | Sync parameter counts from Hugging Face |
| `npm run prisma:push` | Apply the schema to the DB |

## The sync engine

`lib/sync.ts` runs a full sync = **discover** + **refresh**:

1. **Discovery** (`lib/discover.ts`) — fetches the top `text-generation` models from the HF `/api/models` list, sorted by downloads, filtered to canonical publishers and a sane LLM parameter range (0.5B–2000B). Upserts them with **popularity** (`downloads`/`likes`), exact `totalParams` (from `safetensors.total`), `gated`, and `createdAt`. This is the **model roster source** — the catalog auto-includes new popular open LLMs.
2. **Refresh** (`syncCatalog`) — for catalog models not covered by discovery (e.g. curated large models not in the top list), fetches each individually and updates the same fields.

`lib/seed-data.ts` is kept as an **enrichment override**: for repos it knows, it supplies curated `activeParams` (MoE — HF doesn't expose this), `family`, and friendly `name`. So MoE accuracy is preserved while the roster comes from HF.

The sync is:

- **Idempotent** — safe to run repeatedly.
- **Non-fatal** — a `403` (gated, no token), `404`, `429`, or network error keeps the last good value and logs a warning.
- **Auditable** — records `lastSyncedAt` per model and a global `SyncLog` row (with `discovered` count).

The catalog's default sort is **popularity** (downloads desc); parameter-count and footprint sorts are also available.

It is triggered three ways:

1. **`POST /api/sync`** (guarded) — for automation:
   ```bash
   curl -X POST https://your-host/api/sync \
     -H "x-sync-secret: $SYNC_SECRET"
   ```
   Without the correct header the route returns `401`.
2. **`npm run sync`** — for manual / local runs.
3. **Cron** — see below.

### Caveat: the model formula vs. the spec's worked example

The spec's Definition-of-Done cites a check "744B @ Q4 / 32K ≈ 235 GB". The §5.1 formula (the source of truth) gives **744B @ Q4 ≈ 442 GB** (4 bits/weight → 372 GB weights alone). The ≈235 figure actually corresponds to **Q2** (≈228 GB). The engine implements the formula exactly; the unit tests assert the formula-correct values and include the Q2 case. See `tests/memory.test.ts`.

## Scheduling

### Vercel Cron

`vercel.json` schedules a daily `GET /api/sync` at 04:00 UTC. Vercel Cron can only send GET (no custom headers), so the route authenticates Vercel Cron via its `vercel-cron` user-agent (and still requires `SYNC_SECRET` to be configured). Manual/curl/system-cron use `POST` with the `x-sync-secret` header.

### System cron (self-hosted VPS)

A daily `curl` POST with the secret header:

```cron
# /etc/cron.d/llm-fit-finder  — sync daily at 04:00
0 4 * * * appuser /usr/bin/curl -fsS -X POST http://localhost:3000/api/sync \
  -H "x-sync-secret: CHANGE_ME" -o /var/log/llmfit-sync.log
```

Or run the script directly from a checkout:

```cron
0 4 * * * appuser cd /opt/llm-fit-finder && /usr/bin/npm run sync >> /var/log/llmfit-sync.log 2>&1
```

## Deployment

### Vercel

1. Push the repo to GitHub and import it on Vercel.
2. Set environment variables: `DATABASE_URL` (Postgres), `SYNC_SECRET`, optional `HF_TOKEN`.
3. Vercel detects Next.js automatically. The cron in `vercel.json` runs daily.
4. Run `npx prisma db push` once against your Postgres (with `DATABASE_URL` set), then `npm run seed`.

### Self-hosted (Docker)

```bash
# Build
docker build -t llm-fit-finder .

# Migrate + seed the DB once (needs prisma; run from a checkout or the builder stage)
DATABASE_URL="postgresql://user:pass@host:5432/llmfit" npx prisma db push
DATABASE_URL="postgresql://user:pass@host:5432/llmfit" npm run seed

# Run
docker run -d -p 3000:3000 \
  -e DATABASE_URL="postgresql://user:pass@host:5432/llmfit" \
  -e SYNC_SECRET="your-secret" \
  -e HF_TOKEN="" \
  --name llm-fit-finder llm-fit-finder
```

For **SQLite in Docker**, mount a volume for the database file and set `DATABASE_URL=file:/data/dev.db`, then run `prisma db push` against that path. Postgres is recommended for production.

> The container does **not** include dev tooling (`tsx`, `prisma` CLI). Run migrations from a checkout or the builder stage, and trigger syncs via the HTTP endpoint (set up system cron to `curl` `/api/sync`).

## Project structure

```
app/
  (marketing)/page.tsx     landing
  fit/page.tsx             Mode A: Hardware → Models
  model/page.tsx           Mode B: Model → Hardware
  catalog/page.tsx         filterable catalog
  model/[slug]/page.tsx    model detail + per-quant table
  api/sync/route.ts        POST/GET sync (guarded)
components/
  budget-bar.tsx           signature Memory Budget Bar
  fit/, model/, catalog/   mode-specific UI
  ui.tsx, shared-controls, verdict-badge
lib/
  memory.ts                calculation engine (pure, tested)
  hardware.ts              GB → named hardware (pure)
  discover.ts              HF list discovery (roster + popularity)
  prisma.ts, db.ts, config.ts, sync.ts   server-only
  seed-data.ts             curated MoE/family/name override + bootstrap seed
  slug.ts, format.ts, types.ts
prisma/
  schema.prisma, seed.ts
scripts/sync.ts            npm run sync entry
tests/memory.test.ts
Dockerfile, vercel.json
```

## How the numbers work (spec §5, the source of truth)

```
weights  = totalParamsB * bitsPerWeight[quant] / 8
kv       = clamp(0.5 * sqrt(activeParamsB ?? totalParamsB / 70), 0.03, 0.9) * (ctx/1000)
           (÷4 if q4 KV cache)
overhead = 0.15 * (weights + kv)
total    = weights + kv + overhead
```

- **Dense:** attention uses `total`. **MoE:** attention uses `active` (smaller) — total drives memory, active drives speed.
- Verdict (discrete): `fast` (≤ VRAM) · `offloaded` (≤ VRAM+RAM) · `won't-fit`.
- Verdict (unified): `fast` (≤ 90%) · `tight` (≤ 100%) · `won't-fit`.

## Caveats (surfaced honestly in the UI)

- Weights are exact; **KV cache is an estimate** and varies by architecture (GQA, head dims).
- Real GGUF files run **~5–10% larger** than the theoretical weight size.
- For MoE models, **total params drive memory; active params drive speed** — never conflated.
- "Fits in memory" ≠ "runs fast": offloaded and unified setups are usable but slower (roughly single-digit tok/s for large models).

## Testing

```bash
npm test            # 19 unit tests for lib/memory.ts + lib/hardware.ts
npm run typecheck   # tsc --noEmit
npm run lint
```
