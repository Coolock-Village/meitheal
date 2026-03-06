/**
 * Calendar Domain — Barrel Export
 * @domain calendar
 * @bounded-context integration
 */
export {
  startMultiCalendarSync,
  startCalendarSync,
  stopCalendarSync,
  syncFromHA,
  pushTaskToCalendar,
  getCalendarSyncStatus,
  getCalendarSyncConfigs,
  getCalendarSyncConfig,
  startCalDAVSync,
  stopCalDAVSync,
  syncCalDAVEvents,
  type CalendarSyncConfig,
  type CalendarSyncStatusEntity,
  type TaskCalendarMeta,
} from "./calendar-bridge";
