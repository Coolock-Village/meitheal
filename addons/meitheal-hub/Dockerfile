ARG BUILD_FROM
FROM ${BUILD_FROM}

RUN apk add --no-cache nodejs npm curl ca-certificates bash
RUN npm install -g pnpm@10.8.0

WORKDIR /opt/meitheal
COPY . /opt/meitheal

# Install production deps only (build already done on host)
RUN pnpm install --frozen-lockfile=false --ignore-scripts --prod \
    && pnpm store prune

COPY addons/meitheal-hub/run.sh /run.sh
COPY addons/meitheal-hub/run-local.sh /run-local.sh
RUN chmod +x /run.sh /run-local.sh

CMD ["/run.sh"]
