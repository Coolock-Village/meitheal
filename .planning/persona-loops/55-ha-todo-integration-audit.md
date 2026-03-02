# 55-Persona Audit — HA Todo Integration

**Date:** 2026-03-02
**Scope:** Deep integration of HA Todo entity services + WebSocket into Meitheal task system

## Reference Baseline

- HA Core `todo/__init__.py` — WebSocket commands: `todo/item/subscribe`, `todo/item/list`, `todo/item/move`
- HA Core `todo/services.yaml` — Service actions: `get_items`, `add_item`, `update_item`, `remove_item`, `remove_completed_items`
- HA TodoItem fields: `summary`, `uid`, `status` (needs_action | completed), `due` (date/datetime), `description`, `completed` (datetime)
- HA TodoListEntityFeature flags: `CREATE_TODO_ITEM`, `UPDATE_TODO_ITEM`, `DELETE_TODO_ITEM`, `SET_DUE_DATE_ON_ITEM`, `SET_DUE_DATETIME_ON_ITEM`, `SET_DESCRIPTION_ON_ITEM`, `MOVE_TODO_ITEM`
- Competitors: HA native `local_todo`, Todoist integration, Google Tasks integration

## Audit Matrix

| # | Persona | Domain | Finding | Severity | Action |
|---|---------|--------|---------|----------|--------|
| 1 | HA Addon Expert | Integration | Only `addTodoItem()` exists — missing `get_items`, `update_item`, `remove_item`, `remove_completed_items` | 🔴 Critical | Implement full service wrappers |
| 2 | API Designer | Services | `addTodoItem()` only sends `due_date` — does not support `due_datetime` distinction | ⚠️ Med | Add `due_datetime` parameter with dual-path logic |
| 3 | WebSocket Engineer | Real-time | No `todo/item/subscribe` WebSocket subscription — can't get live updates | 🔴 Critical | Implement WebSocket subscription handler |
| 4 | WebSocket Engineer | Real-time | No `todo/item/list` WebSocket command usage — using only service calls | ⚠️ Med | Add WebSocket list command as alternative to service call |
| 5 | WebSocket Engineer | Real-time | No `todo/item/move` WebSocket command — can't reorder items via WS | ⚠️ Med | Implement move support |
| 6 | Integration Architect | Sync | Calendar bridge has bidirectional sync; Todo has none | 🔴 Critical | Build `todo-bridge.ts` mirroring calendar-bridge pattern |
| 7 | Sync Engineer | Data | No sync FROM HA todo entities TO Meitheal tasks table | 🔴 Critical | Implement inbound sync with deduplication |
| 8 | Sync Engineer | Data | No sync FROM Meitheal tasks TO HA todo entities | ⚠️ Med | Implement outbound push on task create/update |
| 9 | Entity Expert | Discovery | `getTodoEntities()` exists in `ha-entities.ts` but not used anywhere | ⚠️ Med | Wire into settings UI for entity picker |
| 10 | Domain Architect | DDD | No `todo` bounded context — todo logic mixed into `ha/ha-services.ts` | ⚠️ Med | Create `domains/todo/` bounded context |
| 11 | Schema Architect | DB | No `todo_sync_confirmations` table — no deduplication tracking for todo items | ⚠️ Med | Add migration with dedup tracking (like `calendar_confirmations`) |
| 12 | UX Designer | Settings | Settings page lists calendar entities but not todo entities | ⚠️ Med | Add todo entity picker and sync toggle to settings |
| 13 | UX Designer | Dashboard | No todo list widget on dashboard | ⚠️ Med | Add dashboard card showing HA todo items |
| 14 | Feature Parity Analyst | Competitors | HA native card supports `sort_mode` (alpha, duedate) — Meitheal doesn't expose | ℹ️ Low | Add sort options when displaying HA todo items |
| 15 | Feature Parity Analyst | Competitors | HA native card supports `hide_completed` — Meitheal doesn't filter | ℹ️ Low | Add filter toggle |
| 16 | Feature Parity Analyst | Competitors | Todoist integration supports labels, priorities, projects — Meitheal has these natively | ℹ️ Info | Map Meitheal fields to/from todo fields |
| 17 | Feature Parity Analyst | Competitors | Google Tasks supports nested tasks (parent_uid) — HA doesn't expose | ℹ️ Info | No action — HA API limitiation |
| 18 | Feature Parity Analyst | Competitors | HA todo card has `click_behavior` (edit/toggle) — Meitheal should match | ℹ️ Low | Implement click behavior option |
| 19 | API Gateway Engineer | Routes | No REST API routes for HA todo operations | ⚠️ Med | Add `/api/todo/*` routes for proxy operations |
| 20 | Security Architect | Auth | Todo service calls use same `SUPERVISOR_TOKEN` as calendar — good | ℹ️ Info | No action needed |
| 21 | Security Analyst | Auth | WebSocket subscription doesn't validate entity access | ℹ️ Low | Add entity_id validation |
| 22 | Penetration Tester | API | New todo API routes need CSRF protection | ⚠️ Med | Apply existing middleware |
| 23 | Data Engineer | Mapping | TodoItem `uid` field mapping to Meitheal task `id` not defined | ⚠️ Med | Define bidirectional UID mapping in sync table |
| 24 | Data Engineer | Mapping | TodoItem `status` (needs_action/completed) vs Meitheal task `status` (todo/in_progress/done) mismatch | ⚠️ Med | Define mapping: needs_action → todo, completed → done |
| 25 | Data Engineer | Mapping | TodoItem `due` can be date OR datetime — Meitheal `due_date` is always string | ⚠️ Med | Handle both formats in sync logic |
| 26 | Data Engineer | Mapping | TodoItem `description` maxlength unknown — Meitheal has TEXT column | ℹ️ Info | TEXT column handles any length |
| 27 | Data Engineer | Mapping | TodoItem `completed` datetime not tracked in Meitheal | ℹ️ Low | Add `completed_at` column to tasks table |
| 28 | Test Architect | Testing | No tests for todo service wrappers — calendar has 3 tests | 🔴 Critical | Write unit + integration tests for all todo services |
| 29 | Test Automation | E2E | No E2E test for todo sync round-trip | ⚠️ Med | Add E2E test similar to `ha-calendar-adapter.spec.ts` |
| 30 | QA Lead | Coverage | Zero test coverage for todo domain | 🔴 Critical | Achieve parity with calendar test coverage |
| 31 | Performance Engineer | Sync | Full sync fetches ALL todo items — no incrementalism | ⚠️ Med | Use `todo/item/subscribe` for incremental updates |
| 32 | Performance Engineer | Polling | Calendar bridge uses periodic polling — todo should use WS subscriptions instead | ⚠️ Med | Prefer subscription over interval-based sync |
| 33 | Resilience Engineer | Offline | Offline queue only handles task CRUD — not todo sync operations | ℹ️ Low | Phase 5+ — offline todo sync |
| 34 | Product Manager | Feature | Can create tasks in Meitheal but can't push them to HA todo lists | ⚠️ Med | Implement write-back to HA todo entities |
| 35 | Product Manager | Feature | Can't select which HA todo list to sync with — hardcoded entityId | ⚠️ Med | Make entity configurable via settings |
| 36 | Product Manager | Feature | No multi-list support — can only sync one todo entity at a time | ⚠️ Med | Support multiple todo entity sync |
| 37 | Accessibility Engineer | ARIA | New todo UI components need proper ARIA roles (listbox, option, checkbox) | ⚠️ Med | Add ARIA attributes |
| 38 | i18n Engineer | Text | Todo-related strings will be hardcoded English | ℹ️ Low | Add to en.json and ga.json translation files |
| 39 | Observability Engineer | Logging | Calendar bridge has structured logging — todo bridge should match | ⚠️ Med | Add structured logging to todo bridge |
| 40 | Error Handling Engineer | Resilience | Calendar bridge swallows errors silently — todo bridge should surface them | ⚠️ Med | Return discriminated union results |
| 41 | DevOps Engineer | CI | No CI job for todo integration testing | ℹ️ Low | Add to existing `live-ha-integration.yml` |
| 42 | Mobile Engineer | PWA | Todo items not included in offline cache/IDB | ℹ️ Low | Future phase |
| 43 | KCS Author | Docs | No documentation for HA todo integration | ⚠️ Med | Update DOCS.md and README.md |
| 44 | Onboarding Engineer | DX | No setup guide for connecting HA todo lists | ⚠️ Med | Add to settings page onboarding flow |
| 45 | HA Frontend Expert | Design | HA todo card is simple list — Meitheal should offer superior kanban/table views | ℹ️ Info | Existing views already exceed HA card |
| 46 | Conflict Resolution Expert | Sync | Bidirectional sync needs conflict strategy — who wins on simultaneous edit? | ⚠️ Med | Use `last_updated` timestamp comparison |
| 47 | Domain Events Engineer | Events | No domain events for todo sync — calendar has `integration.sync.*` events | ⚠️ Med | Emit `todo.sync.requested`, `todo.sync.completed` events |
| 48 | Migration Engineer | DB | Need new migration for `todo_sync_state` tracking table | ⚠️ Med | Create Drizzle migration |
| 49 | Release Engineer | Versioning | All-at-once release could break existing installs if todo entity not configured | ℹ️ Low | Make todo sync opt-in via settings |
| 50 | Open Source Engineer | Community | todolist is one of HA's most-requested features — good differentiation story | ℹ️ Info | Document in README as integration highlight |

## Exceeding Competitors Analysis

| Feature | HA Native | Todoist | Google Tasks | Meitheal (Target) |
|---------|-----------|--------|--------------|-------------------|
| CRUD operations | ✅ | ✅ | ✅ | ✅ Full API surface |
| Real-time updates | ✅ WS subscribe | ❌ Polling | ❌ Polling | ✅ WS subscribe |
| Due date/datetime | ✅ | ✅ | ✅ | ✅ Both formats |
| Description | ✅ | ✅ | ✅ | ✅ |
| Item reordering | ✅ `move` | ❌ | ❌ | ✅ Via WS command |
| Multi-list support | N/A | ✅ Projects | ✅ Tasklists | ✅ Multiple entities |
| Kanban view | ❌ | ❌ | ❌ | ✅ **Exceeds** |
| RICE scoring | ❌ | ❌ | ❌ | ✅ **Exceeds** |
| Table view + filters | ❌ | ❌ | ❌ | ✅ **Exceeds** |
| Calendar sync | ❌ Separate | ❌ | ❌ | ✅ **Exceeds** |
| Offline support | ❌ | ❌ | ❌ | ✅ **Exceeds** |
| Bidirectional sync | ❌ | ❌ | ❌ | ✅ **Exceeds** |
| Notifications | ❌ | ❌ | ❌ | ✅ **Exceeds** |
| Automation ready | ❌ Card only | ❌ | ❌ | ✅ **Exceeds** |

## Summary

| Severity | Count | Action |
|----------|-------|--------|
| 🔴 Critical | 5 | All must be addressed in this phase |
| ⚠️ Med | 24 | Most addressed in this phase, some deferred |
| ℹ️ Low | 10 | Deferred or no action |
| ℹ️ Info | 11 | No action needed |

## Immediate Actions (Phase 55 — HA Todo Integration)

1. **Implement full todo service wrappers** — `getTodoItems`, `updateTodoItem`, `removeTodoItem`, `removeTodoCompletedItems` (Personas #1, #2)
2. **Implement WebSocket subscription** — `todo/item/subscribe` for real-time updates (Persona #3)
3. **Build `todo-bridge.ts`** — bidirectional sync mirroring calendar-bridge (Personas #6, #7, #8)
4. **Create `domains/todo/` bounded context** — proper DDD separation (Persona #10)
5. **Add DB migration** — `todo_sync_confirmations` table (Personas #11, #48)
6. **Write comprehensive tests** — unit + integration (Personas #28, #29, #30)
7. **Add settings UI** — entity picker, sync toggle, multi-list support (Personas #9, #12, #35, #36)
8. **Add API routes** — `/api/todo/*` REST endpoints (Persona #19)
9. **Status mapping** — needs_action ↔ todo, completed ↔ done (Persona #24)
10. **Update docs** — DOCS.md, README.md, KCS inline (Persona #43)
