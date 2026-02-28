# GSD Tasks - Phase 20 Iteration 01

## 1. Kanban Drag & Drop Hierarchy Rules (Frontier - Platform Architect)

Update `kanban.astro` drag-and-drop handler to update both the `status` and the `parent_id` automatically when moved into an Epic or Story swimlane.

## 2. Parent Breadcrumb in Detail Panel (Frontier - Product Architect)

Enhance `Layout.astro` task detail panel to fetch and show the parent Epic or Story as a clickable link/breadcrumb at the top.

## 3. Keyboard Shortcuts for Task Types (ADHD - Execution Coach)

Add `E`, `S`, `T` keyboard shortcuts in `Layout.astro` task detail panel to rapidly switch task types without clicking the dropdown.

## 4. Sub-task Kanban Indicators (ADHD - Workflow Coach)

Add visual indicator and count to Epic/Story cards displaying how many child tasks they contain in `kanban.astro`.

## 5. Security Audit of Boards API (Frontier - Security Engineer)

Limit unrestricted `/api/boards` POST creation. Add rate-limiting or basic pagination.

## 6. Contextual Task Creation (ADHD - Automation Coach)

Ensure the `+` button in a swimlane dynamically passes `task_type` and `parent_id` when invoking `api/tasks`.

## 7. JS Graceful Fallback for Invalid Types (Frontier - Reliability Engineer)

Ensure fallback matching for undefined/malformed types in `kanban.astro` HTML dataset variables.
