# Phase 6 Plan 05: Inline Style Migration & Quick-Add UX — Research

**Researched:** 2026-03-14
**Domain:** CSS code quality, inline style migration, quick-add UX patterns
**Confidence:** HIGH

## Summary

35 inline styles remain in kanban.astro. They fall into 3 migration categories: (1) **static styles** that can move directly to CSS classes (toolbar labels, layout containers, quick-add form, lane mgmt buttons — ~20 items), (2) **dynamic styles** that compute values at render time and MUST stay inline (type dots with dynamic colors, card border-left with task color — ~7 items), and (3) **display:none initial state** that's toggled by JS (~1 item).

**Primary recommendation:** Migrate static inline styles to CSS classes in _kanban.css. Do NOT migrate dynamic color styles — they require Astro render-time computation. Additionally, polish the quick-add task form UX to match Teamhood's clean inline card creation pattern.

## Standard Stack

No new dependencies needed. CSS classes in `_kanban.css` handle all migrations.

## Architecture Patterns

### What CAN be migrated (static styles → CSS classes)
| Location | Lines | Style | CSS Class |
|----------|-------|-------|-----------|
| Toolbar labels | 257, 271 | `margin-right: 4px` | `.toolbar-label` |
| Actions slot | 167 | `display:flex; gap:8px; align-items:center` | `.kanban-actions-slot` |
| Type toolbar | 188 | `padding: 8px 0` | `.kanban-type-toolbar` |
| Lane mgmt header | 290 | flex layout | `.lane-mgmt-header` |
| Lane mgmt close | 298 | font-size/padding | `.lane-mgmt-close` |
| Lane mgmt add row | 302 | flex gap | `.lane-mgmt-add-row` |
| Lane add input | 308 | flex/font | `.lane-add-input` |
| Lane add button | 314 | font-size | `.lane-add-btn` |
| Lane item row | 1139 | flex layout | `.lane-item` (already exists?) |
| Lane drag handle | 1140 | cursor/color/size | `.lane-drag-handle` |
| Lane label | 1141 | flex/font | `.lane-item-label` |
| Lane WIP label | 1142 | complex flex | `.lane-wip-label` |
| Lane WIP input | 1143 | width/font/border | `.lane-wip-input` |
| Lane edit/remove | 1148-1149 | button reset | `.lane-action-btn` |
| Built-in label | 1151 | font/color | `.lane-builtin-label` |
| Quick-add input | 1041 | flex/font/padding | `.quick-add-input` |
| Quick-add button | 1042 | font/padding | `.quick-add-btn` |
| Card custom field text | 531,551,578 | `color:var(--text-primary)` | `.cf-value-text` |

### What MUST stay inline (dynamic render-time values)
| Location | Lines | Why |
|----------|-------|-----|
| Type dots | 207, 216, 225 | Dynamic `background: #color` per type |
| Card border-left | 458 | Dynamic `border-left: 4px solid ${task.color}` |
| Swimlane add | 374 | `display:none` toggled by JS grouping |
| Lane mgmt panel | 287 | `display:none` initial hidden state |

## Common Pitfalls

### Pitfall 1: Lane Management Uses Template Literals
**What goes wrong:** Lane mgmt items are rendered as JS template literal strings (innerHTML), not Astro JSX
**Why it matters:** CSS class names work fine, but the HTML must use `class="..."` not `className="..."`
**How to avoid:** Use `class=` (standard HTML attribute) in template literals

### Pitfall 2: Quick-Add Form Inline Focus
**What goes wrong:** Moving quick-add styles to CSS but losing the `autofocus` behavior
**How to avoid:** Keep `autofocus` attribute, only migrate visual styles

## Don't Hand-Roll

| Problem | Don't Build | Use Instead |
|---------|-------------|-------------|
| Form input styling | Custom CSS per form | Reuse existing `.form-input` class |
| Button styling | New button class | Reuse existing `.btn .btn-primary` |

## Sources

### Primary (HIGH confidence)
- Codebase analysis (kanban.astro inline style catalogue)
- Existing CSS classes in _kanban.css

**Research date:** 2026-03-14
**Valid until:** 2026-04-14
