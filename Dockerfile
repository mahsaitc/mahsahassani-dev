# Multi-stage build. The runner ships only Next's standalone output, so the
# final image carries no source, no dev dependencies and no npm cache.
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --ignore-scripts
# npm skips an optional dependency that fails to install without failing the
# build. If sharp's native libvips is missing, next/image silently serves
# unoptimised originals, so stop here instead.
RUN node -e "require('sharp')"

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1

# Build-time origins. NEXT_PUBLIC_* values are inlined into the client and
# server bundles (site URL feeds sitemap/robots/metadata), and next.config.mjs derives images.remotePatterns from both — the
# standalone server freezes that config at build. A different value per
# environment therefore needs its own image build; changing the runtime env
# alone is not enough. API_BASE_URL is also read at runtime (compose sets it).
ARG NEXT_PUBLIC_API_BASE_URL
ARG API_BASE_URL
ARG NEXT_PUBLIC_SITE_URL=https://mahsahassani.dev
ENV NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL} \
    API_BASE_URL=${API_BASE_URL} \
    NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL}

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
