# Phase 17: Full Persona Audit — Context

**Gathered:** 2026-02-28
**Status:** Executed (reconciled with plan/summary artifacts)

## Phase Boundary

Phase 17 is a comprehensive 50-persona panel audit of the entire Meitheal application. Every function, domain, addition, and architectural decision is audited against PM frameworks, DDD principles, KCS methodology, and compliance standards. No improvements exist until 50 personas have unanimously approved.

**Methodology:** Full GSD cycle (discuss → research → plan → execute → verify) repeated per domain until zero findings remain.

**Compliance frameworks applied:**

- SOC 2 Type II controls
- ISO 27001:2022
- WCAG 2.1 AA / Section 508
- EN 301 549
- Cyber Essentials Plus
- ISO 42001 (AI governance)
- OWASP Top 10

**PM frameworks applied:**

- DDD (bounded contexts, ubiquitous language, architecture follows domains)
- KCS (document as you go, knowledge as product surface, self-service by default)
- RICE/DRICE/HEART scoring
- 50-persona panel review (Frontier Panel + ADHD Panel + Domain-Specific)

## Audit Domains

### 1. Tasks Domain

- CRUD API (create, read, update, delete)
- Board filtering (board_id query param)
- Custom fields (JSON storage, per-task values, settings persistence)
- Framework payload (RICE scoring, DRICE, HEART)
- Calendar sync (HA adapter, CalDAV)
- Subtasks (parent_id hierarchy)
- Time tracking (time_tracked column)

### 2. Boards Domain

- Board CRUD API (GET/POST/PUT/DELETE)
- Default board auto-creation
- Board deletion cascading
- Board switcher UX (sidebar, client-side filtering)

### 3. Kanban Domain

- Column rendering (status-based grouping)
- Card UX (priority bar, description, actions, drag-and-drop)
- Custom lanes (localStorage, injection)
- Add task from lane
- Board filtering

### 4. Table Domain

- Inline editing (contenteditable blur)
- RICE column + filter
- Status/priority dropdowns (a11y)
- Custom fields column

### 5. Settings Domain

- Custom field CRUD
- Integration configs (Calendar, Grocy, n8n, Webhooks, AI)
- Framework selection (RICE/DRICE/Custom)
- Keyboard shortcuts reference

### 6. Dashboard Domain

- Stats rendering
- Quick actions
- Recent tasks

### 7. Observability Domain

- Structured logging (createLogger)
- Redaction patterns
- Audit trail
- Error handling

### 8. Integration Domain

- Home Assistant ingress auth
- Calendar sync service
- Webhook emission
- Grocy adapter

### 9. PWA / Offline Domain

- Service worker
- Manifest
- Offline queue

### 10. Security Domain

- Middleware (headers, CSP)
- Input sanitization (XSS prevention)
- Rate limiting
- SSRF prevention (unfurl)
- API auth (ingress header validation)

### 11. Vikunja Compat Domain

- /api/v1/tasks
- /api/v1/projects
- OpenAPI spec

### 12. UI/UX / A11y Domain

- ARIA labels
- Keyboard navigation
- Color contrast
- Screen reader compatibility
- Responsive design
- Dark mode consistency

## 50-Persona Panel Composition

### Frontier Panel (20 personas)

1. Security Engineer
2. GDPR/Compliance Officer
3. DevOps/SRE
4. Frontend Developer
5. API Architect
6. Database Engineer
7. HA Ecosystem Engineer
8. Webhook Architect
9. Observability SRE
10. Performance Engineer
11. Accessibility Engineer
12. Mobile/PWA Specialist
13. AI Governance Analyst
14. Integration Architect
15. Search/UX Researcher
16. Data Protection Officer
17. Incident Commander
18. Technical Writer
19. CI/CD Specialist
20. Cloud Infrastructure Engineer

### ADHD Panel (10 personas)

21. Focus Optimizer
2. Automation Specialist
3. Context Switch Manager
4. Decision Fatigue Reducer
5. Execution Coach
6. Cognitive Load Analyst
7. Dopamine Loop Designer
8. Task Momentum Specialist
9. Friction Identifier
10. Time Blindness Mitigator

### Domain-Specific Panel (10 personas)

31. Astro Framework Expert
2. SQLite/libSQL Expert
3. Home Assistant Add-on Expert
4. Vikunja Power User
5. Trello Power User
6. Todoist Power User
7. Obsidian Vault Manager
8. Grocy Community Member
9. n8n Workflow Designer
10. Node-RED Flow Builder

### End-User Panel (10 personas)

41. ADHD Professional (Ryan avatar)
2. Community Organizer
3. Elderly Resident
4. Parent / Caregiver
5. Small Business Owner
6. Student
7. Volunteer Coordinator
8. Government Procurement Officer
9. Auditor (SOC 2 / ISO)
10. New User (first-time setup)

## Deferred Ideas

None — Phase 17 is a comprehensive audit, not a feature phase.

---

*Phase: 17-full-persona-audit*
*Context gathered: 2026-02-28*
