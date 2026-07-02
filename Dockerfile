# syntax=docker/dockerfile:1
# Self-hosted deployment image for LLMFitCheck (Node 20.9+, Linux).
# Build:  docker build -t llmfitcheck .
# Run:    docker run -p 3000:3000 \
#           -e DATABASE_URL="postgresql://user:pass@host:5432/llmfitcheck" \
#           -e SYNC_SECRET="your-secret" \
#           [-e HF_TOKEN="hf_xxx"] \
#           llmfitcheck
# Migrate the DB once (from any host with prisma) before first run:
#   DATABASE_URL=... npx prisma db push

# ---- builder ----
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
RUN npm run build

# ---- runner ----
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

# Production dependencies (next, react, @prisma/client, lucide-react).
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# The generated Prisma client + query engine from the builder.
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Built app + schema + static assets.
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["npm", "start"]
