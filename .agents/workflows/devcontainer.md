---
description: Start/stop the HA devcontainer stack for integration testing
---

# Devcontainer Management

// turbo-all

Start, stop, or check the HA Supervisor devcontainer stack.

## Start the stack

```bash
./scripts/devcontainer-up.sh up
```

Access points after startup:

- **HA UI**: <http://localhost:7123/>
- **Supervisor API**: <http://localhost:7357/>
- **Grocy**: <http://localhost:9192/>
- **Node-RED**: <http://localhost:1880/>

## Stop the stack

```bash
./scripts/devcontainer-up.sh down
```

## Check status

```bash
./scripts/devcontainer-up.sh status
```

## Tail HA logs

```bash
./scripts/devcontainer-up.sh logs
```

## When to use

Use the devcontainer for any change that touches:

- Ingress path rewriting (`middleware.ts`, `serve.mjs`, `ingress-policy.ts`)
- HA API / WebSocket (`domains/ha/`, `domains/todo/`)
- Supervisor API (`run.sh`, `config.yaml`, `llm_api.py`)
- Addon lifecycle (start/stop/restart, build commands)
- Calendar/Todo sync
- Entity exposure or LLM API registration

For CSS, layout, and component-only changes, use `npm run dev` in `apps/web/` instead.
