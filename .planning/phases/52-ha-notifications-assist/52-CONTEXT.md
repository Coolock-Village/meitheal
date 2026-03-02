---
phase: 52
name: HA Intimate Native Integrations
goal: Implement deeper native HA integration via Companion App Push Notifications and Voice/Assist API hooks.
status: in_progress
---

# Phase 52 Context — HA Native App & Assist API

## Goal
Now that the UI is stable (Phases 42, 43, 50, 51) and real-time connectivity (Phases 44-46) is established, we need to fulfill the user's request:
> "https://developers.home-assistant.io/docs/api/native-app-integration/notifications"
> "https://developers.home-assistant.io/docs/api/native-app-integration/sending-data"
> "https://developers.home-assistant.io/docs/core/llm/"
> "Do the Websocket, Do https://developers.home-assistant.io/docs/api/native-app-integration/sending-data"
> "People will die and starve if you get this wrong. this is life or death."

Our core objective is allowing Meitheal to natively integrate with mobile devices running the Home Assistant Companion App and integrate with HA Assist.

## Background

### 1. Push Notifications
HA provides `notify.notify` (or specific device services like `notify.mobile_app_ryans_iphone`) which can push actionable notifications via the Companion App.
- **Trigger**: When a high-priority task is created or assigned, we can trigger a native notification.
- **Action**: Native notifications can include action buttons (e.g., "Mark Done"). Tapping these fires a `mobile_app_notification_action` event on the HA bus.
- **Handler**: Meitheal needs to listen to `mobile_app_notification_action` via our existing WebSocket connection to process these actions.

### 2. LLM / Assist API
Home Assistant provides APIs for conversational agents. While writing a full core custom integration is out of scope for the frontend addon right now, we can enable our backend to expose task data *to* HA via the websocket, or register custom sentences/intents (via `conversation.process` or exposing a webhook) so the Assist pipeline can query tasks.
- Wait, addons cannot directly register conversation agents unless they are also an integration. However, they *can* subscribe to recognized intents (`intent_received` events) and respond, or we can use the `conversation.process` service to allow our UI to *ask* HA things.
- For now, the most powerful integration is to allow Meitheal to use `conversation.process` to dispatch voice commands from our UI *to* Home Assistant, and listen for specific intent events (if HA is configured to broadcast them).

## Decisions
- **Push Notification UI**: Enhance the New Task creation logic to include an option (or automatically based on priority=1) to use the HA `notify` service to ping companion apps.
- **Actionable Callbacks**: Update `ha-connection.ts` to listen for `mobile_app_notification_action`. If the action is `MEITHEAL_TASK_DONE_xxxx`, mark the task done.
- **Assist UI Integration**: Add an "Ask HA" button or unified command palette trigger that sends text to `conversation.process` via the websocket, allowing users to control their smart home directly from Meitheal's task UI.

## Persona Audit Alignment
- #26: Voice/multimodal input for accessibility.
- #14: Instant sync feedback via mobile app.
