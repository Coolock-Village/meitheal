# 03 - GSD Plan and Tasks

## Synthesized Tasks

1. **Move HA Ingress Injection to Edge** (Source: Platform Architect)
   - *Task:* Update `Layout.astro` or middleware to inject `ha-ingress` class on the server (`body class:list`) based on `Astro.locals.ingressPath` instead of relying on client-side JS.
   - *Command Map:* `/gsd-execute-phase 58`

2. **Semantic Tokens for Toasts** (Source: OSS Integrations Specialist)
   - *Task:* Extract `rgba()` colors from `_feedback.css` into `_tokens.css` as CSS variables (`--color-success`, etc.) and apply them to toast notifications to ensure dark mode contrast.
   - *Command Map:* `/gsd-execute-phase 58`

3. **Modal Backdrop Fallback** (Source: Reliability Engineer)
   - *Task:* Add a solid `background-color: rgba(0,0,0,0.5)` fallback to `.modal-overlay` in `_modal.css` before the `backdrop-filter` rule.
   - *Command Map:* `/gsd-execute-phase 58`

4. **Touch-Accessible Bento Hover Actions** (Source: Product Architect)
   - *Task:* Update `.bento-card-actions` in `_cards.css` to appear on `:focus-within`, `:active`, or add a structural change so it isn't strictly hidden on touch screens.
   - *Command Map:* `/gsd-execute-phase 58`

5. **Screen Reader Text for Priority Dots** (Source: Workflow Coach)
   - *Task:* Add `span.sr-only` inside priority dot usages (e.g., in `_tasks.css` or ASTRO templates) or ensure `aria-label` is applied directly to the `.priority-dot`.
   - *Command Map:* `/gsd-execute-phase 58`

6. **Standardize Focus Rings** (Source: Execution Coach)
   - *Task:* Remove `.focus-visible` outline suppression overrides across all 14 CSS partials.
   - *Command Map:* `/gsd-execute-phase 58`

7. **Create CSS Architecture KCS Artifact** (Source: Knowledge Coach)
   - *Task:* Document the 14-file domain structure and Tailwind v4 CSS variable usage in `STYLEGUIDE.md` or `ARCHITECTURE.md`.
   - *Command Map:* `/gsd-execute-phase 58`

8. **Add Stylelint to CI** (Source: Automation Coach)
   - *Task:* Configure `stylelint` and add a `npm run lint:css` script to the `ci.yml` GitHub action.
   - *Command Map:* `/gsd-execute-phase 58`
