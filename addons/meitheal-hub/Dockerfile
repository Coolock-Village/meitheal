ARG BUILD_FROM
FROM ${BUILD_FROM}

# HA add-on metadata labels
LABEL io.hass.type="addon"

RUN apk add --no-cache nodejs npm curl ca-certificates bash
RUN npm install -g pnpm@10.8.0

# Create non-root user for defense-in-depth
RUN addgroup -S meitheal && adduser -S meitheal -G meitheal

WORKDIR /opt/meitheal
COPY . /opt/meitheal

# Install production deps only (build already done on host)
RUN pnpm install --frozen-lockfile=false --ignore-scripts --prod \
    && pnpm store prune

COPY addons/meitheal-hub/run.sh /run.sh
COPY addons/meitheal-hub/run-local.sh /run-local.sh
RUN chmod +x /run.sh /run-local.sh

# Ensure data directory exists and is writable by meitheal user
RUN mkdir -p /data && chown -R meitheal:meitheal /data /opt/meitheal

USER meitheal

CMD ["/run.sh"]
