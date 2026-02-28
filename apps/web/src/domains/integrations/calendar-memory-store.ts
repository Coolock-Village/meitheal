interface CalendarConfirmation {
  taskId: string;
  confirmationId: string;
  confirmedAt: string;
}

const confirmations = new Map<string, CalendarConfirmation>();

export function saveCalendarConfirmation(taskId: string): CalendarConfirmation {
  const record = {
    taskId,
    confirmationId: crypto.randomUUID(),
    confirmedAt: new Date().toISOString()
  };
  confirmations.set(taskId, record);
  return record;
}

export function getCalendarConfirmation(taskId: string): CalendarConfirmation | undefined {
  return confirmations.get(taskId);
}
