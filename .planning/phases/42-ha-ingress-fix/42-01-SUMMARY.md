---
phase: 42
plan: 42-01
status: complete
completed: 2026-03-02
---

# Summary 42-01: Fix 5 Ingress Bugs

## What Was Done

Fixed 5 root causes of HTTP errors behind HA Supervisor ingress in v0.1.11:

| Bug | Root Cause | Fix | File |
|-----|-----------|-----|------|
| 404 double-prefix | Fetch interceptor prefixes URLs already prefixed after ClientRouter navigation | Added `!input.startsWith(ip)` guard | `Layout.astro` |
| 403 CSRF | Origin=HA host, Host=addon container | Skip CSRF when `ingressPath` set | `middleware.ts` |
| 401 health flood | Missing `credentials: "include"` | Added to health check fetch | `connectivity.ts` |
| CSP blocking | No `data:` for ClientRouter scripts | Added `data:` + `ws: wss:` | `middleware.ts` |
| Dead code | Unused `allowedHosts` variable | Removed | `middleware.ts` |

## Commits

- `5a7736a` — 🐛 fix: resolve 5 ingress bugs causing 401/403/404 errors (v0.1.11)

## Issues Encountered

- None. All fixes verified with successful build.
