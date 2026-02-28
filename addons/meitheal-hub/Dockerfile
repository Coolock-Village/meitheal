ARG BUILD_FROM
FROM ${BUILD_FROM}

RUN apk add --no-cache nodejs npm curl ca-certificates
RUN npm install -g pnpm@10.8.0

WORKDIR /opt/meitheal
COPY . /opt/meitheal

# Minimal install for add-on runtime; production hardening comes in subsequent slices.
RUN pnpm install --frozen-lockfile=false --ignore-scripts || true

COPY run.sh /run.sh
RUN chmod +x /run.sh

CMD ["/run.sh"]
