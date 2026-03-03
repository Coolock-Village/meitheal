# 58-Persona Audit — HA LLM API Integration (Robots & Chat)

**Date:** 2026-03-03
**Scope:** HA LLM API integration, AskAssist chat modal, AI context service, conversation agent support, custom component LLM tools

> **⚠️ PLAN ONLY — No implementation work. Findings feed into GSD discuss/plan/execute phases.**

## Current Surface Area

| File | Purpose |
|------|---------|
| `apps/web/src/domains/ai/ai-context-service.ts` | External AI provider prompt generation + routing |
| `apps/web/src/components/ha/AskAssistModal.astro` | Chat modal UI (sparkles button) |
| `apps/web/src/pages/api/ha/assist.ts` | API proxy to HA `conversation.process` |
| `apps/web/src/domains/ha/ha-services.ts` | `askAssist()` — calls `conversation.process` via WebSocket |
| `apps/web/src/components/settings/SettingsAgents.astro` | AI provider + agent protocol config |
| `apps/web/src/components/layout/TopNavigation.astro` | Sparkles (✦) button trigger |
| `integrations/home-assistant/custom_components/meitheal/__init__.py` | Custom component (no LLM API) |
| `integrations/home-assistant/custom_components/meitheal/services.yaml` | HA services (create_task, complete_task, sync_todo) |

## Audit Matrix

| # | Persona | Domain | Finding | Severity | Recommended Action |
|---|---------|--------|---------|----------|-------------------|
| 1 | HA Integration Architect | Conversation API | `askAssist()` passes no `conversation_id` — every message is stateless, no multi-turn | 🔴 High | Track `conversation_id` per session, send on subsequent calls |
| 2 | HA Integration Architect | Conversation API | No `agent_id` parameter — always uses default conversation agent, ignoring user's configured LLM agents (e.g. Google Generative AI, OpenAI) | 🔴 High | Add agent discovery + agent selector |
| 3 | LLM API Specialist | LLM API | Custom component (`__init__.py`) doesn't register any LLM API — Meitheal tasks are invisible to HA's conversation agents | 🔴 High | Register `MeithealAPI` with task management tools |
| 4 | UX Designer | Chat Modal | Modal has no conversation context — user types, gets response, but can't continue the conversation naturally | 🔴 High | Implement multi-turn with `conversation_id` tracking |
| 5 | Product Manager | Feature Gap | "Robots" functionality mentioned but has no implementation — just a settings page with external provider links | ⚠️ Med | Add HA-native Assist integration as the primary "robot" |
| 6 | HA Addon Expert | Agent Discovery | No endpoint/UI to list available HA conversation agents — user can't see what's available | ⚠️ Med | Add `/api/ha/agents` discovery endpoint |
| 7 | UX Designer | Settings | AI Provider section in `SettingsAgents.astro` only handles external providers (ChatGPT, Claude, Gemini) — no HA-native agent configuration | ⚠️ Med | Add HA Conversation Agent selector in settings |
| 8 | API Designer | Response Handling | `askAssist()` ignores `response_type` field from HA (could be `action_done`, `query_answer`, or `error`) — always returns speech text | ⚠️ Med | Parse and handle different response types in UI |
| 9 | Frontend Engineer | Chat Modal | No typing/loading indicator while waiting for HA response — user doesn't know if request was sent | ⚠️ Med | Add animated loading state |
| 10 | Accessibility Engineer | Chat Modal | Chat history lacking `role` attributes and `aria-live` region — screen readers can't follow conversation | ⚠️ Med | Add `role="log"`, `aria-live="polite"` to chat container |
| 11 | LLM API Specialist | Task Context | Task context isn't injected into Assist calls — user says "help me with my task" but HA has no Meitheal context | ⚠️ Med | Add optional task context parameter to assist endpoint |
| 12 | HA Integration Architect | Custom Component | `services.yaml` only has 3 services — no way for HA automations to query tasks by status, search, or get overdue count | ⚠️ Med | Add `meitheal.search_tasks`, `meitheal.get_overdue` services |
| 13 | Security Architect | API | Assist endpoint has no rate limiting specific to LLM calls — could drive up API costs on LLM providers | ⚠️ Med | Add LLM-specific rate limiting |
| 14 | DDD Architect | Domain Boundary | AI domain (`domains/ai/`) only has `ai-context-service.ts` — no proper bounded context for the HA Assist/LLM integration | ⚠️ Med | Create `domains/ai/ha-assist-service.ts` for HA-native AI |
| 15 | Performance Engineer | WebSocket | Each assist call goes through HTTP API → WebSocket — extra hop; could call WebSocket directly from client in HA context | ℹ️ Low | Keep server-side proxy for security; document trade-off |
| 16 | Error Handling Eng | API | Assist endpoint returns generic "Internal server error" — no error classification or retry guidance | ℹ️ Low | Add structured error codes |
| 17 | Test Architect | Testing | No tests for assist endpoint or AI context service | ℹ️ Low | Add e2e tests |
| 18 | i18n Engineer | Chat Modal | "Ask Home Assistant" title and "Turn off the living room lights..." placeholder hardcoded in English | ℹ️ Low | Use i18n keys |
| 19 | KCS Author | Documentation | No documentation about how Assist/Chat feature works or how to configure HA conversation agents | ℹ️ Low | Add KCS doc |
| 20 | Mobile UX Eng | Chat Modal | Modal not optimized for mobile input — keyboard may cover response area | ℹ️ Low | Add viewport-aware positioning |
| 21 | Observable Engineer | Logging | No structured logging for conversation turns — can't trace multi-turn conversations | ℹ️ Low | Add request_id and conversation_id to logs |
| 22 | HA Addon Expert | Config | Addon `config.yaml` doesn't declare `llm` or `homeassistant_api` requirement | ℹ️ Info | Verify addon permissions for conversation.process |
| 23 | Privacy Engineer | Data | Chat messages not stored — no conversation history persistence | ℹ️ Info | By design — ephemeral; document this |
| 24 | Schema Architect | Database | No schema for conversation sessions — if multi-turn added, need session tracking | ℹ️ Info | Consider localStorage for client-side session tracking |
| 25 | Domain Architect | DDD | `ai-context-service.ts` mixes two concerns: prompt generation and provider routing | ℹ️ Info | Acceptable for current scope; separate in future |

## Summary

| Severity | Count | Action |
|----------|-------|--------|
| 🔴 High | 4 | Implement in Phase 58 |
| ⚠️ Med | 10 | Implement in Phase 58 |
| ℹ️ Low | 7 | 5 implement now, 2 defer |
| ℹ️ Info | 4 | No action needed |

## Immediate Actions (Phase 58)

### P0 — Core Infrastructure
1. **Multi-turn conversation support** (#1, #4) — Track `conversation_id` per session
2. **Agent discovery endpoint** (#2, #6) — `GET /api/ha/agents` listing HA conversation agents
3. **Agent selector in AskAssist** (#2, #7) — Dropdown to pick conversation agent
4. **Custom component LLM API tools** (#3) — Register Meitheal tasks as HA LLM tools

### P1 — UX Enhancement
5. **Loading indicator** (#9) — Animated typing state
6. **Response type handling** (#8) — Show different UI for action_done vs query_answer vs error
7. **Task context injection** (#11) — Optional current-task context with Assist calls
8. **Accessibility** (#10) — aria-live, roles, screen reader support

### P2 — Settings & Config
9. **HA Conversation Agent picker** (#7) — Settings → Agents → HA Assist section
10. **Rate limiting** (#13) — LLM-specific throttle
11. **Domain restructure** (#14) — `ha-assist-service.ts`

### P3 — Polish
12. **i18n** (#18) — Translate chat modal strings
13. **Error codes** (#16) — Structured errors
14. **Tests** (#17) — E2E coverage
15. **KCS documentation** (#19) — User-facing docs

## Scope Expansion Consideration

Per user directive to "expand scope for high-impact HA deepening":
- **Custom component LLM tools (#3)** is the highest-impact item — makes Meitheal tasks first-class citizens in HA's AI ecosystem. Any HA conversation agent (Google, OpenAI, Ollama) can then create/query/complete Meitheal tasks via natural language.
- **Additional custom component services (#12)** — `search_tasks` and `get_overdue` would give HA automations and LLM agents much richer task awareness.

---

*Persona audit: 2026-03-03 — Phase 58 LLM API Integration*
*Status: PLAN ONLY — ready for GSD discuss/plan phases*
