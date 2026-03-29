# ─── Étape 1 : dépendances ────────────────────────────────────────────────────
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma/
# Installe toutes les deps (dev inclus) pour le build
RUN npm ci

# ─── Étape 2 : build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Génère le client Prisma et build Next.js (standalone)
RUN npx prisma generate && npm run build

# Compile les scripts TS → JS (sans tsx ni uuid en prod)
RUN node_modules/.bin/tsc \
      prisma/init-admin.ts \
      prisma/show-admin.ts \
      --esModuleInterop \
      --module commonjs \
      --moduleResolution node \
      --skipLibCheck \
      --outDir prisma/dist

# ─── Étape 3 : image de production ────────────────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# App Next.js standalone (contient server.js + node_modules runtime)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Fichiers publics
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Prisma : binaire natif du query engine (non inclus dans standalone)
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Prisma CLI : uniquement pour `prisma migrate deploy` au démarrage
COPY --from=builder /app/node_modules/prisma ./node_modules/prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# Migrations et scripts d'init (compilés en JS, pas de tsx en prod)
COPY --from=builder /app/prisma/schema.prisma ./prisma/schema.prisma
COPY --from=builder /app/prisma/migrations ./prisma/migrations
COPY --from=builder /app/prisma/dist ./prisma/

# Entrypoint
COPY --from=builder /app/entrypoint.sh ./entrypoint.sh

# Dossier uploads
RUN mkdir -p /app/public/uploads && chown -R nextjs:nodejs /app/public/uploads

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["sh", "entrypoint.sh"]
