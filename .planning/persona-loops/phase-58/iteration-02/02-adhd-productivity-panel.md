# Panel 2 — ADHD/Productivity Specialists

**Phase:** 58 · **Iteration:** 02 · **Focus:** Security, Code Quality, UI/UX

---

## 🔄 Workflow Coach

**Observation:** The `styles/` directory now has 15 CSS files. A contributor looking for "where is the kanban drag-drop style?" has to guess between `_kanban.css`, `_tasks.css`, and `_layout.css`. No INDEX or map exists.

**Recommendation:** Add a comment block at the top of `global.css` that maps each partial to its domain + key classes it contains (e.g., `/* _kanban.css — .kanban-board, .kanban-column, .kanban-card, .drag-over, .lane-mgmt */`).

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 3 | 1 | 1 | **Accept** |

**Success criterion:** `head -40 global.css` shows domain-to-class mapping for each import.

---

## ⚡ Execution Coach

**Observation:** CI brace-balance check (`.github/workflows/ci.yml:27-36`) currently checks a single CSS file. After the split, it should check ALL partials. If a partial gets corrupted, CI won't catch it.

**Recommendation:** Update the CI brace check to glob `apps/web/src/styles/*.css` and check each file individually.

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 4 | 1 | 1 | **Accept** |

**Success criterion:** CI yml iterates over all CSS files. A deliberately broken brace in a partial fails CI.

---

## 📚 Knowledge Coach

**Observation:** Each partial starts with a 1-line file header comment (e.g., `/* _tokens.css — Design tokens, themes, font faces */`) but lacks a "domain boundary" comment explaining WHAT goes here vs. other files. Contributors will add classes to the wrong file over time.

**Recommendation:** Add 2-3 line header comments to each partial explaining the boundary rule. Example for `_tasks.css`: `/* Domain: tasks bounded context. Classes for task-item, bento grid, checklist, priorities. Do NOT add kanban-specific or table-specific styles here — use _kanban.css or _table.css. */`

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 3 | 2 | 1 | **Accept** |

**Success criterion:** Each `_*.css` file has a multi-line header with boundary guidance.

---

## 🎯 Focus Optimizer

**Observation:** This iteration is correctly scoped to quality/security/UX of the CSS split itself — not expanding into new features. The task list is focused. No scope creep.

**Recommendation:** No action needed — scope is clean. One iteration should resolve all accepted findings.

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 1 | 1 | 1 | **Reject** |

**Reject rationale:** No actionable work. Scope is already clean.

---

## 🤖 Automation Coach

**Observation:** The duplicate `@keyframes` and duplicate class issues could be caught automatically. A simple `grep`-based lint could enforce "one definition per selector per partial set."

**Recommendation:** Add a CI step that checks for duplicate `@keyframes` names and warns on duplicate selectors across partials.

| Impact | Effort | Risk | Decision |
|--------|--------|------|----------|
| 3 | 3 | 2 | **Defer** |

**Defer rationale:** Good for long-term health but effort is medium (need to handle intentional overrides in responsive/print media queries). Accept when a CSS lint tool is adopted.
