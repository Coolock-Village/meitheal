# Frontier Panel — Phase 5 Iteration 01

## Recommendations

| ID | Persona | Recommendation | Score |
|----|---------|----------------|-------|
| FR-501 | Cryptographer | For timingSafeEqual in Workers: convert tokens to `Uint8Array` via `TextEncoder`, then XOR all bytes and check if result is 0. `crypto.subtle.timingSafeEqual` is not standard — manual constant-time compare is safer. | 10 |
| FR-502 | OWASP Specialist | CSRF: validate `Origin` header AND `Sec-Fetch-Site` header. Both must be present and match. `Sec-Fetch-Site: same-origin` is the strongest signal. | 9 |
| FR-503 | Accessibility Lead | `aria-live` region must use `role="status"` for sync state (polite) and `role="alert"` for errors (assertive). Two separate regions. | 9 |
| FR-504 | PWA Expert | Precache revision: don't roll your own — use a build-time manifest with content hashes. If not using Workbox, SHA-256 the file content and append as query param. | 8 |
| FR-505 | DDD Architect | Shared types package must NOT contain business logic — only interfaces, type aliases, and enums. Logic stays in domain packages. | 10 |
| FR-506 | GDPR Specialist | Data deletion must be "hard delete" — not soft delete. Include IndexedDB cleanup instruction in response. Emit audit event BEFORE deletion. | 8 |

## Cycle Decision: Proceed to execution

All 6 recommendations accepted and integrated into implementation approach.
