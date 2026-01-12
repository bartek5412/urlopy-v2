# Multi-stage build dla Next.js

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Skopiuj pliki package management
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Zainstaluj zależności
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Skopiuj zależności z poprzedniego stage
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Wygeneruj Prisma Client
RUN npx prisma generate

# Zbuduj aplikację
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

# Zainstaluj wget dla healthcheck
RUN apk add --no-cache wget

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Skopiuj standalone output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Skopiuj Prisma schema i wygenerowany client
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/node_modules/.prisma ./node_modules/.prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
