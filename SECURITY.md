# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

**Email:** [info@coolockvillage.ie](mailto:info@coolockvillage.ie)

Please include:

- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Response Timeline

| Action | Timeframe |
|--------|-----------|
| Acknowledgment | 48 hours |
| Assessment | 5 business days |
| Fix deployed | 14 business days (critical: 48 hours) |

## Scope

**In scope:**

- All API endpoints (`/api/*`)
- Vikunja-compat API layer
- Home Assistant ingress auth
- Webhook emission (HMAC signing, URL validation)
- Cloudflare Workers runtime (`apps/api`)
- IndexedDB offline sync (client-side)
- Service worker and PWA

**Out of scope:**

- Home Assistant Supervisor itself
- Third-party integrations (Grocy, n8n, Node-RED APIs)
- Social engineering attacks
- Denial of service attacks

## Security Measures

- **Transport:** HTTPS enforced via HA ingress
- **Auth:** Bearer token + HA Supervisor token + Ingress user identity (X-Hass-User-Id)
- **AppArmor:** Restrictive container profile denying shell access, system writes, raw sockets
- **Non-root container:** Runs as `meitheal` user, not root
- **CSRF protection:** Origin/Referer validation on mutation requests; rejects requests with missing headers in standalone mode
- **Webhooks:** HMAC-SHA256 signed payloads
- **URL validation:** Private IP rejection (SSRF protection)
- **Rate limiting:** Token bucket per IP with memory caps (10K middleware / 5K compat); automatic FIFO eviction under pressure
- **Input sanitization:** All user input validated via Zod schemas + `sanitize-html`
- **OOM protection:** HTML rewriting capped at 5MB; rate limiter Maps bounded
- **IP normalization:** Port stripping, IPv6 bracket unwrapping, whitespace trim
- **Offline:** IndexedDB data encrypted at rest (browser-managed)
- **Structured logging:** All API errors logged via domain-observability logger; PII redaction patterns
- **Request tracing:** X-Request-Id + X-Response-Time headers on all responses
- **CSP:** Dynamic frame-ancestors for HA ingress iframe embedding
- **Settings caching:** DB queries cached with 60s TTL to prevent query-per-request overhead
- **Code ownership:** CODEOWNERS enforces review for security-sensitive paths (auth, middleware, rate-limit)
- **Dependency scanning:** Dependabot for npm, GitHub Actions, and Docker base images
- **CI security audit:** `pnpm audit` runs on every push/PR
- **security.txt:** RFC 9116 compliant disclosure endpoint at `/.well-known/security.txt`

## Acknowledgments

We thank the security community for helping keep Meitheal safe.
