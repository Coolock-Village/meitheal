# Optimization Actions — Phase 2 Iteration 01

| Action ID | Action | Impact | Effort | Risk | Priority Score | Status | Mapped Task ID |
|-----------|--------|--------|--------|------|----------------|--------|----------------|
| OA-201 | Add back-pressure to webhook emitter — drop non-critical events on queue overflow. | 4 | 3 | 3 | 10 | Open | — |
| OA-202 | Add TTL/LRU eviction to rate limiter Map — prevent unbounded memory growth. | 4 | 2 | 3 | 9 | Open | T-211 |
| OA-203 | Add indexes to webhook_deliveries table: (status, created_at) and (subscriber_id, event_type). | 4 | 1 | 2 | 7 | Open | T-204 |
| OA-204 | Add migration 0004 fixture to migration-splitter spec. | 3 | 1 | 2 | 6 | Open | T-206 |
| OA-205 | Document webhook secret rotation strategy (dual-secret verification window). | 3 | 2 | 4 | 9 | Open | T-232 |
| OA-206 | Exclude /api/health from rate limiter middleware. | 3 | 1 | 3 | 7 | Open | T-212 |
