# Security Policy

## Reporting Vulnerabilities

If you discover a security vulnerability, please report it responsibly:

**Email:** [security@meitheal.dev](mailto:security@meitheal.dev)

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
- **Auth:** Bearer token + HA Supervisor token
- **Webhooks:** HMAC-SHA256 signed payloads
- **URL validation:** Private IP rejection (SSRF protection)
- **Rate limiting:** Token bucket per IP (X-Forwarded-For / CF-Connecting-IP)
- **Input sanitization:** All user input validated via Zod schemas
- **Offline:** IndexedDB data encrypted at rest (browser-managed)

## Acknowledgments

We thank the security community for helping keep Meitheal safe.
