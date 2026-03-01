# ── Stage 1: Build ──
# Compiles the Astro app inside Docker so the final image is self-contained.
ARG BUILD_FROM
FROM node:22-alpine AS builder

RUN npm install -g pnpm@10.8.0

WORKDIR /build
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json tsconfig.base.json ./
COPY apps/ apps/
COPY packages/ packages/

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
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json ./
COPY packages/ packages/
COPY apps/web/package.json apps/web/package.json

# Copy built output from builder stage
COPY --from=builder /build/apps/web/dist apps/web/dist/

# Copy migration scripts and SQL files needed at runtime
COPY apps/web/scripts/ apps/web/scripts/
COPY apps/web/drizzle/ apps/web/drizzle/

# Install production deps only
RUN pnpm install --frozen-lockfile=false --ignore-scripts --prod \
    && pnpm store prune

COPY meitheal-hub/run.sh /run.sh
COPY meitheal-hub/run-local.sh /run-local.sh
RUN chmod +x /run.sh /run-local.sh

# Ensure data directory exists and is writable by meitheal user
RUN mkdir -p /data && chown -R meitheal:meitheal /data /opt/meitheal

USER meitheal

CMD ["/run.sh"]
