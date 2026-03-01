# Contributing to Meitheal

## Getting Started

```bash
# Clone the repo
git clone https://github.com/Coolock-Village/meitheal.git
cd meitheal

# Install dependencies (pnpm required)
pnpm install

# Run the dev server
pnpm --filter web dev

# Run type checks
pnpm check

# Run tests
pnpm test
```

## Branch Naming

Use feature branches from `main`:

- `feat/<description>` — new features
- `fix/<description>` — bug fixes
- `docs/<description>` — documentation only
- `chore/<description>` — tooling, CI, dependencies

## Commit Messages

Use conventional commits with emoji prefixes:

```text
feat(scope): description
fix(scope): description
docs(scope): description
chore(scope): description
test(scope): description
```

Examples:

```text
feat(offline): Add IDB attachment store for image uploads
fix(ux): Suppress keyboard shortcuts when task detail is open
docs(kcs): Update PWA guide with attachment documentation
```

## Monorepo Structure

- `apps/web` — Astro PWA frontend + API routes
- `apps/api` — Cloudflare Workers adapter
- `packages/domain-*` — Pure domain logic (DDD bounded contexts)
- `meitheal-hub` — Home Assistant OS add-on
- `tests/e2e` — Playwright e2e tests
- `tests/governance` — Repo standards enforcement
- `docs/` — ADRs, KCS runbooks, methodology docs

## Development Guidelines

1. **DDD boundaries** — domain logic goes in `packages/domain-*`, not in pages
2. **KCS compliance** — update docs when behavior changes (same commit)
3. **Astro-first** — prefer Astro integrations over custom solutions
4. **Type safety** — `pnpm check` must pass with 0 errors before committing
5. **Test coverage** — add tests for new features in `tests/e2e/`

## HA Add-on Development

The HA add-on lives in `meitheal-hub/`:

```bash
# Build the add-on container locally
docker build -t meitheal-hub --build-arg BUILD_FROM=ghcr.io/home-assistant/amd64-base:latest meitheal-hub

# Run locally (outside HA Supervisor)
docker run -p 3000:3000 -v $(pwd)/data:/data meitheal-hub /run-local.sh
```

Key files:

- `config.yaml` — add-on manifest (ingress, API roles, AppArmor, options)
- `apparmor.txt` — security profile (auto-enforced by Supervisor)
- `translations/en.yaml` — English option descriptions for HA UI
- `run.sh` — Supervisor entrypoint
- `run-local.sh` — Local dev entrypoint (no bashio)

## Pull Request Process

1. Create a feature branch
2. Make changes, ensuring `pnpm check` and `pnpm test` pass
3. Push and open a PR against `main`
4. PR must pass all 6 CI jobs before merge
