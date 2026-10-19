// Напоминания в браузере не поддерживаются: страница не может надёжно показать уведомление
// в заданное время, если она закрыта. Поэтому в настройках вместо переключателя —
// пояснение, что напоминания доступны в приложении на iPhone.
export const REMINDERS_SUPPORTED = false;

export async function scheduleDailyReminder() {
  return 'unsupported';
}

export async function cancelReminders() {}
