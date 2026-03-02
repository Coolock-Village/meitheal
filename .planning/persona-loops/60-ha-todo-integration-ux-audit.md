# 60-Persona Audit — HA Todo Integration (Pass 2)

**Date:** 2026-03-02
**Scope:** Full UX, integration architecture, user experience, and settings flow for HA Todo entity sync

## Reference Baseline

- HA Core WebSocket commands: `todo/item/subscribe`, `todo/item/list`, `todo/item/move`
- HA Core service actions: `get_items`, `add_item`, `update_item`, `remove_item`, `remove_completed_items`
- HA TodoItem fields: `summary`, `uid`, `status` (needs_action | completed), `due` (date/datetime), `description`, `completed` (datetime)
- HA TodoListEntityFeature flags: `CREATE_TODO_ITEM`, `UPDATE_TODO_ITEM`, `DELETE_TODO_ITEM`, `SET_DUE_DATE_ON_ITEM`, `SET_DUE_DATETIME_ON_ITEM`, `SET_DESCRIPTION_ON_ITEM`, `MOVE_TODO_ITEM`
- Existing patterns: `calendar-bridge.ts` (single entity, polling + entity change), `SettingsIntegrations.astro` (4 sections: Calendar, Grocy, n8n, Webhooks)
- Current state: `ha-services.ts` has 7 todo wrappers. `domains/todo/` exists but is empty. No API routes, no tests, no settings UI.

## Audit Matrix

### Integration Architecture (Personas 1–15)

| # | Persona | Domain | Finding | Severity | Action |
|---|---------|--------|---------|----------|--------|
| 1 | HA Addon Expert | Integration | 7 todo service wrappers exist in `ha-services.ts` but no bounded context to use them | 🔴 Critical | Create `domains/todo/` bounded context with bridge + mapper |
| 2 | Integration Architect | Sync | Calendar bridge is single-entity polling — todo should use WS subscriptions | ⚠️ Med | Use `todo/item/subscribe` for real-time instead of polling interval |
| 3 | Integration Architect | Sync | Calendar bridge creates inline tables — todo should use migration file | ⚠️ Med | Create proper migration for `todo_sync_confirmations` |
| 4 | Sync Engineer | Data | No inbound sync: HA todo items → Meitheal tasks | 🔴 Critical | Build `syncTodoFromHA()` with deduplication |
| 5 | Sync Engineer | Data | No outbound sync: Meitheal tasks → HA todo entity | ⚠️ Med | Build `pushTaskToTodoList()` with confirmation tracking |
| 6 | Data Engineer | Mapping | Status mismatch: HA 2-state vs Meitheal 3-state | ⚠️ Med | Map: `needs_action` ↔ `todo`/`in_progress`, `completed` ↔ `done` |
| 7 | Data Engineer | Mapping | `due` can be date-only or datetime — different HA service fields | ⚠️ Med | Detect format and use `due_date` vs `due_datetime` correctly |
| 8 | Domain Architect | DDD | No barrel export for todo domain | ⚠️ Med | Create `domains/todo/index.ts` barrel |
| 9 | API Gateway Engineer | Routes | No REST API routes for todo CRUD | ⚠️ Med | Add `/api/todo/*` routes proxying to HA services |
| 10 | API Gateway Engineer | Routes | Need sync control API: enable/disable/trigger | ⚠️ Med | Add `/api/todo/sync` with action-based POST |
| 11 | Conflict Resolution Expert | Sync | Bidirectional sync needs conflict strategy | ⚠️ Med | Use `last_updated` timestamp comparison |
| 12 | Performance Engineer | Sync | Initial full sync should not block startup | ⚠️ Med | Run initial sync async after connection established |
| 13 | Resilience Engineer | Errors | Calendar bridge swallows errors — todo should surface them | ⚠️ Med | Return discriminated union results with structured logging |
| 14 | Observability Engineer | Logging | All sync events need structured logging matching calendar pattern | ⚠️ Med | Use `createLogger` with `domain: "todo", component: "todo-bridge"` |
| 15 | Domain Events Engineer | Events | No domain events for sync lifecycle | ℹ️ Low | Emit `todo.sync.requested`, `todo.sync.completed` events |

### UX & Settings (Personas 16–32)

| # | Persona | Domain | Finding | Severity | Action |
|---|---------|--------|---------|----------|--------|
| 16 | UX Designer | Settings | **No "Todo Sync" section** in SettingsIntegrations — the biggest UX gap | 🔴 Critical | Add Todo Sync section mirroring Calendar Sync pattern |
| 17 | UX Designer | Settings | Calendar section has auto-detect callout for HA entities — todo needs same | ⚠️ Med | Add "✓ Automatic sync active" callout for todo entities |
| 18 | UX Designer | Settings | Calendar section has detected entity list — todo needs same | ⚠️ Med | Show detected `todo.*` entities in settings |
| 19 | UX Designer | Settings | Need enable/disable toggle — **user explicitly requested opt-in for power saving** | 🔴 Critical | Add prominent enable/disable toggle with power-saving explanation |
| 20 | UX Designer | Settings | Need sync direction picker (inbound/outbound/bidirectional) like Grocy has | ⚠️ Med | Add sync mode select dropdown |
| 21 | UX Designer | Settings | Need "Sync Now" button like calendar has | ⚠️ Med | Add manual sync trigger with result indicator |
| 22 | UX Designer | Settings | Need sync status indicator (last sync time, item count) | ⚠️ Med | Show last sync timestamp and item count |
| 23 | UX Designer | Dashboard | No HA todo list card on dashboard | ℹ️ Low | Future: dashboard widget showing HA todo items |
| 24 | Product Manager | Feature | Can't select which todo entity to sync — needs entity picker | ⚠️ Med | Add entity text input with auto-detect helper |
| 25 | Product Manager | Feature | Multi-list support — sync multiple `todo.*` entities | ℹ️ Low | Future: multi-entity config |
| 26 | Onboarding Engineer | DX | No setup guide for connecting HA todo lists | ⚠️ Med | Add inline help text in settings section |
| 27 | Accessibility Engineer | ARIA | New todo settings section needs proper labels and ARIA | ⚠️ Med | Add `aria-label`, `for`, proper form groups |
| 28 | i18n Engineer | Text | Todo UI strings need translations | ℹ️ Low | Add to `en.json` and `ga.json` |
| 29 | Mobile Engineer | Touch | Todo settings controls need 44px min-height touch targets | ⚠️ Med | Match existing mobile CSS patterns |
| 30 | KCS Author | Docs | No documentation for todo integration in README/DOCS | ⚠️ Med | Add todo integration section to docs |
| 31 | Theme Engineer | CSS | Settings section styling must match existing `integration-section` class | ℹ️ Info | Reuse existing CSS — no new styles needed |
| 32 | Animation Eng | Transitions | Settings section should use same tab show/hide transitions | ℹ️ Info | Already handled by tab switching logic |

### Testing & Quality (Personas 33–45)

| # | Persona | Domain | Finding | Severity | Action |
|---|---------|--------|---------|----------|--------|
| 33 | Test Architect | Testing | No tests for status mapping logic | 🔴 Critical | Unit tests for status mapping + due date detection |
| 34 | Test Architect | Testing | No tests for todo service wrappers | ⚠️ Med | Integration tests mirroring `ha-calendar-adapter.spec.ts` |
| 35 | Test Automation | E2E | No E2E test for sync round-trip | ⚠️ Med | Add todo sync E2E test |
| 36 | QA Lead | Coverage | Zero test coverage for todo domain | 🔴 Critical | Target 19+ tests (parity with first pass) |
| 37 | Build Engineer | TypeScript | New files must pass `tsc --noEmit` | ⚠️ Med | Verify clean after each file |
| 38 | Penetration Tester | API | Todo API routes need existing CSRF middleware | ⚠️ Med | Apply middleware to new routes |
| 39 | Security Analyst | Auth | Service calls use SUPERVISOR_TOKEN — correct | ✅ Info | No action needed |
| 40 | Release Engineer | Versioning | Todo sync must be opt-in — don't break existing installs | ⚠️ Med | Disabled by default, settings toggle |

### Feature Parity & Differentiation (Personas 41–50)

| # | Persona | Domain | Finding | Severity | Action |
|---|---------|--------|---------|----------|--------|
| 41 | Feature Parity | Competitors | HA native card has sort mode (alpha/due) | ℹ️ Low | Future enhancement |
| 42 | Feature Parity | Competitors | HA native card has hide_completed toggle | ℹ️ Low | Future enhancement |
| 43 | Feature Parity | Competitors | Meitheal kanban/table/calendar views exceed all competitors | ✅ Info | Already exceeds |
| 44 | Feature Parity | Competitors | Meitheal RICE scoring exceeds all competitors | ✅ Info | Already exceeds |
| 45 | Feature Parity | Competitors | Todoist/Google Tasks have no offline support | ✅ Info | Already exceeds |
| 46 | Open Source Eng | Community | Todo integration is a strong differentiation story | ✅ Info | Document in README |
| 47 | HA Frontend Expert | Design | HA todo card is a simple list — Meitheal offers richer views | ✅ Info | Already exceeds |
| 48 | Migration Engineer | DB | `todo_sync_confirmations` table migration needed | ⚠️ Med | Create `0002_todo_sync.sql` |
| 49 | CI Engineer | Pipeline | Add todo tests to existing CI jobs | ℹ️ Low | Extend `ci.yml` test step |
| 50 | Container Eng | Docker | No Docker changes needed for todo integration | ✅ Info | No action |

### UX Deep-Dive: Settings Todo Section (Personas 51–60)

| # | Persona | Domain | Finding | Severity | Action |
|---|---------|--------|---------|----------|--------|
| 51 | UX Researcher | Flow | User flow: Settings → Integrations → Todo → Enable → Select Entity → Choose Direction → Save | ⚠️ Med | Implement in order |
| 52 | UX Researcher | Flow | Need clear "disabled" state that explains what sync does and power cost | ⚠️ Med | Show help text when disabled |
| 53 | UX Researcher | Flow | When enabled, auto-detect available entities and pre-fill if only one exists | ⚠️ Med | Auto-fill entity if single `todo.*` found |
| 54 | Information Architect | Content | Section description should explain: what syncs, direction options, power impact | ⚠️ Med | Write clear copy |
| 55 | Visual Designer | Status | Status badge: "Active" (green) / "Disabled" (gray) / "Error" (red) — match calendar | ⚠️ Med | Use existing badge classes |
| 56 | Interaction Designer | Toggle | Enable/disable should be a clear toggle, not buried — **per user feedback** | 🔴 Critical | Prominent toggle at top of section |
| 57 | Interaction Designer | Feedback | "Sync Now" button needs loading state + result message like calendar has | ⚠️ Med | Reuse `cal-sync-result` pattern |
| 58 | Error UX Designer | Errors | Show meaningful error if no HA connection or no todo entities found | ⚠️ Med | Error callout with guidance |
| 59 | Documentation Writer | Help | Inline help: "Find entities in HA → Developer Tools → States → search todo." | ⚠️ Med | Add `<small>` helper text |
| 60 | Settings Architect | Persistence | Save/load todo sync settings to DB via existing `/api/settings` pattern | ⚠️ Med | Use `saveSetting()` pattern |

## Summary

| Severity | Count | Action |
|----------|-------|--------|
| 🔴 Critical | 6 | All must be addressed |
| ⚠️ Med | 30 | Most addressed in this phase |
| ℹ️ Low/Info | 24 | Deferred or no action |

## Exceeding Competitors

| Feature | HA Native | Todoist | Google Tasks | Meitheal (Target) |
|---------|-----------|--------|--------------|-------------------|
| CRUD operations | ✅ | ✅ | ✅ | ✅ Full API surface |
| Real-time updates | ✅ WS | ❌ Polling | ❌ Polling | ✅ WS subscribe |
| Item reordering | ✅ move | ❌ | ❌ | ✅ Via WS command |
| Opt-in sync control | ❌ | ❌ | ❌ | ✅ **Settings toggle** |
| Power-saving mode | ❌ | ❌ | ❌ | ✅ **Disable sync** |
| Bidirectional sync | ❌ | ❌ | ❌ | ✅ **Exceeds** |
| Kanban/Table views | ❌ | ❌ | ❌ | ✅ **Exceeds** |
| RICE scoring | ❌ | ❌ | ❌ | ✅ **Exceeds** |
| Offline support | ❌ | ❌ | ❌ | ✅ **Exceeds** |

## Prioritized Implementation Order

1. **Status mapper** — `todo-status-mapper.ts` (foundation for all sync logic)
2. **Todo bridge** — `todo-bridge.ts` (WS subscription, opt-in sync, multi-direction)
3. **Barrel export** — `domains/todo/index.ts`
4. **DB migration** — `0002_todo_sync.sql`
5. **API routes** — `/api/todo/`, `/api/todo/items`, `/api/todo/sync`
6. **Settings UI** — SettingsIntegrations.astro Todo Sync section (entity picker, toggle, direction, sync now)
7. **Unit tests** — status mapper, due date detection, round-trip
8. **Docs** — INTEGRATIONS.md, README.md, inline KCS
