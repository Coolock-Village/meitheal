---
phase: 42
name: HA Ingress Auth Fix
goal: Resolve all 401/403/404 errors when Meitheal runs behind HA Supervisor ingress proxy
status: complete
---

# Phase 42 Context — HA Ingress Auth Fix

## Goal

Fix all HTTP error issues (401 Unauthorized, 403 CSRF mismatch, 404 double-prefix) that occur when Meitheal Hub runs inside the HA Supervisor ingress proxy.

## Background

HA Supervisor ingress proxies browser requests through `/api/hassio_ingress/{token}/`. The Supervisor validates the user's HA session before forwarding. The addon must:
1. Trust ALL requests from the Supervisor (no additional auth)
2. Handle URL rewriting for client-side navigation (Astro ClientRouter)
3. Not block requests with CSRF origin checks (origin ≠ host behind proxy)

## Decisions

- **Trust ingress proxy**: When `X-Ingress-Path` header is present, skip CSRF origin check (Supervisor already authenticated)
- **Double-prefix guard**: Fetch interceptor checks if URL already has ingress path before prefixing
- **CSP relaxation for ingress**: `data:` in `script-src`, `ws: wss:` in `connect-src`

## Deferred Ideas

- Server-side API proxy (unnecessary — Supervisor handles auth)
- Client-side WebSocket auth (not needed behind ingress)
