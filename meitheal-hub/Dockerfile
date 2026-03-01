# ── Global build args ──
# BUILD_FROM is passed by HA Supervisor (e.g. ghcr.io/home-assistant/aarch64-base:3.20)
ARG BUILD_FROM

# ── Stage 1: Build ──
# Clones the monorepo from GitHub and builds the Astro app.
# HA Supervisor uses the addon directory as Docker build context,
# so we cannot COPY from the repo root — we clone instead.
FROM node:22-alpine AS builder

ARG BUILD_VERSION=0.1.0

RUN apk add --no-cache git
RUN npm install -g pnpm@10.8.0

WORKDIR /build
RUN git clone --depth=1 https://github.com/Coolock-Village/meitheal.git .

# Install all deps (including devDependencies for build)
RUN pnpm install --frozen-lockfile=false --ignore-scripts

# Build the Astro app
RUN pnpm --filter @meitheal/web build

# ── Stage 2: Runtime ──
# Lean HA add-on image with only production artifacts.
FROM ${BUILD_FROM}

LABEL io.hass.type="addon"

RUN apk add --no-cache nodejs npm curl ca-certificates bash
RUN npm install -g pnpm@10.8.0

# Create non-root user for defense-in-depth
RUN addgroup -S meitheal && adduser -S meitheal -G meitheal

WORKDIR /opt/meitheal

# Copy monorepo scaffolding
COPY --from=builder /build/pnpm-workspace.yaml /build/pnpm-lock.yaml /build/package.json ./
COPY --from=builder /build/packages/ packages/
COPY --from=builder /build/apps/web/package.json apps/web/package.json

# Copy built output from builder stage
COPY --from=builder /build/apps/web/dist apps/web/dist/

# Copy migration scripts and SQL files needed at runtime
COPY --from=builder /build/apps/web/scripts/ apps/web/scripts/
COPY --from=builder /build/apps/web/drizzle/ apps/web/drizzle/

# Install production deps only
RUN pnpm install --frozen-lockfile=false --ignore-scripts --prod \
    && pnpm store prune

# Copy entrypoints from builder (not from build context)
COPY --from=builder /build/meitheal-hub/run.sh /run.sh
COPY --from=builder /build/meitheal-hub/run-local.sh /run-local.sh
RUN chmod +x /run.sh /run-local.sh

# Ensure data directory exists and is writable by meitheal user
RUN mkdir -p /data && chown -R meitheal:meitheal /data /opt/meitheal

USER meitheal

CMD ["/run.sh"]
