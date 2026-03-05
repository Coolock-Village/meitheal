# Ryan's TODO — Meitheal
> Generated 2026-03-05 17:27 UTC

## 🔴 Deploy & Test (This Session)

### Node-RED / n8n Event Bus Fix
- [ ] **Deploy Meitheal to HA** — rebuild addon Docker image with the `webhook-dispatcher.ts` fix
- [ ] **Test in Node-RED:** Add an `events: all` node → set Event Type to `meitheal_task_created` → create a task in Meitheal → verify event appears in debug panel
- [ ] **Install `hass-node-red` companion integration** (HACS) — this is what lets Node-RED "Expose as" entities in HA (switches to enable/disable flows). Without it, entities won't register.
  - Repo: https://github.com/zachowj/hass-node-red
- [ ] **n8n:** Same test — verify webhook or HA event bus events arrive when tasks change

### Phase 60: HA Assist & Voice (Human Verification)
From [60-VERIFICATION.md](file:///home/ryan/code/meitheal/.planning/phases/60-ha-assist-voice/60-VERIFICATION.md):
- [ ] Ask **"What are my tasks?"** in HA Assist → Should return task data
- [ ] Check **Settings → Voice Assistants → Expose** → `todo.meitheal_tasks` should appear
- [ ] Check **Settings → Voice Assistants → Gemini → Configure** → "Meitheal Tasks" in LLM APIs
- [ ] Ask **"Add test task to my tasks"** → Task should appear in Meitheal

---

## 🟡 Recent Conversation Deferrals

### Mobile UX Fixes
- [ ] Verify any remaining mobile layout fixes are deployed and look right on actual device

### Calendar Multi-Select UX
- [ ] Verify the new toggle-card interface is live and calendars can be individually enabled/disabled

### CSS Syntax Warning
- [ ] There's a non-critical CSS warning during build (`box-shadow` rgba value). Low priority but clean it up.

### Middleware Type Error (conv `fe984b1c`)
- [ ] Verify the `DateFormat` type fix is merged and not regressed

---

## 🟢 Ongoing / Recurring

- [ ] **Commit and push** all changes from this session with descriptive messages
- [ ] **Update Vault** if any significant system changes were made
- [ ] **Run governance/lint checks** before pushing (`npm run lint`)
- [ ] **Green squares** — push to GitHub
