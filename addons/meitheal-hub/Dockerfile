ARG BUILD_FROM
FROM ${BUILD_FROM}

RUN apk add --no-cache nodejs npm curl ca-certificates
RUN npm install -g pnpm@10.8.0

WORKDIR /opt/meitheal
COPY . /opt/meitheal

RUN pnpm install --frozen-lockfile=false --ignore-scripts \
 && pnpm --filter @meitheal/web build \
 && NODE_ENV=production pnpm prune --prod \
 && pnpm store prune

COPY run.sh /run.sh
RUN chmod +x /run.sh

CMD ["/run.sh"]
