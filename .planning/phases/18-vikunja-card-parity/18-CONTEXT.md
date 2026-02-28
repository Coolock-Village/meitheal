# Phase 18: Vikunja Card Parity + E2E Testing — Context

**Gathered:** 2026-02-28
**Status:** Executed (reconciled with plan/summary artifacts)

## Phase Boundary

Phase 18 brings Meitheal's task detail view to Vikunja card expansion parity. Every feature visible in Vikunja's task detail modal is implemented, plus command palette and e2e testing audit.

## Gap Analysis: Vikunja vs Meitheal

| Feature | Vikunja | Meitheal | Gap |
|---------|---------|----------|-----|
| Task detail modal | ✅ Full expansion | ❌ None | **Critical** |
| Rich text description | ✅ Markdown toolbar | ❌ Plain text | **Critical** |
| Comments | ✅ Rich editor + thread | ❌ None | **Critical** |
| Labels (colored) | ✅ Color-coded, manageable | ⚠️ String array only | Major |
| Priority | ✅ Visual levels | ✅ 1-5 scale | ✓ Exists |
| Progress % | ✅ Set progress | ❌ None | Major |
| Task color | ✅ Per-task color | ❌ None | Major |
| User assignment | ✅ Assign to user | ❌ Single-user | Minor (HA only) |
| Attachments | ✅ File attachments | ❌ None | Major |
| Task relations | ✅ Parent/child, blocks | ⚠️ parent_id only | Major |
| Start date | ✅ Separate field | ❌ Only due_date | Major |
| End date | ✅ Separate field | ❌ Only due_date | Major |
| Reminders | ✅ Set reminders | ❌ None | Major |
| Repeating interval | ✅ Cron/interval | ❌ None | Major |
| Subscribe/favorites | ✅ Per-task | ❌ None | Minor |
| Move to project | ✅ Move between | ⚠️ Board move only | Minor |
| Command palette | ✅ Global search + cmds | ❌ None | **Critical** |
| Mark as undone | ✅ Toggle | ✅ Checkbox | ✓ Exists |

## Implementation Decisions

### Task Detail Modal

- Full-screen slide-out panel (not small dialog)
- Two-column layout: content (left) + actions sidebar (right)
- URL hash navigation: `#task-{id}` for deep linking
- Rich text editor for description (minimal Markdown toolbar)

### Database Schema Extensions

- `start_date` TEXT — task start date
- `end_date` TEXT — task end date
- `progress` INTEGER DEFAULT 0 — 0-100%
- `color` TEXT — hex color per task
- `is_favorite` INTEGER DEFAULT 0 — favorites flag
- `comments` table — id, task_id, content, author, created_at

### Command Palette

- `Ctrl+K` / `Cmd+K` trigger
- Search tasks, boards
- Quick actions: New task, New board
- Fuzzy match on title

### E2E Testing

- Audit all API endpoints for correctness
- Test task CRUD through UI
- Test board filtering
- Test custom fields persistence
- Test task detail modal open/close/save

## Deferred (not in this phase)

- File attachments (needs storage backend)
- Task relations beyond parent_id (complex)
- Repeating intervals (needs scheduler)
- Reminders (needs notification system)
- User assignment (single-user HA scope)

---

*Phase: 18-vikunja-card-parity*
*Context gathered: 2026-02-28*
