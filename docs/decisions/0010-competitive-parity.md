# ADR-0010: Competitive Parity Decisions

- **Status**: Accepted
- **Date**: 2026-02-28
- **Context**: Phase 29 gap-matrix analysis against 10 OSS PM tools

## Decision

### Features Added (Phase 29)

1. **Task Activity Log** — `task_activity_log` table with field-level change history
   - Parity with: Jira (activity stream), Asana (activity log), Linear (activity)
   - API: `GET /api/tasks/[id]/activity`

2. **Optimistic Locking** — 409 Conflict on stale `updated_at`
   - Parity with: Jira (ETag), Plane (version), Taiga (version)

3. **Comment Counts on Kanban Cards**
   - Parity with: Linear, Plane, Asana (all show activity indicators)

4. **Rate Limiting (120 req/min)**
   - Parity with: GitHub API, Jira Cloud, Asana API

### Gap Matrix Position

| Capability | Before | After |
|---|---|---|
| Audit trail | Weak | Strong |
| Optimistic concurrency | Weak | Strong |
| Rate limiting | Weak | Strong |
| Activity indicators | Partial | Strong |

## Consequences

- Task changes are now auditable
- Concurrent edits are detected and rejected
- API abuse is rate-limited
