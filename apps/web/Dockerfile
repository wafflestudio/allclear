FROM node:22.13-alpine AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN npm install --global corepack@0.34.7 \
    && corepack enable \
    && corepack prepare pnpm@11.9.0 --activate

# --- Dependencies ---
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/mobile/package.json ./apps/mobile/package.json
COPY apps/web/package.json ./apps/web/package.json
RUN pnpm install --frozen-lockfile

# --- Build ---
FROM base AS builder
WORKDIR /app

COPY --from=deps /app ./
COPY . .

RUN pnpm --filter allclear-web build

# --- Production ---
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs

EXPOSE 3000

CMD ["node", "apps/web/server.js"]
