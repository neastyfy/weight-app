// Локальное напоминание о взвешивании — iOS (и Android). Для браузера — reminders.web.js.
// Напоминание приходит каждый день в выбранное время, даже если приложение закрыто.
// Работает без интернета и сервера: уведомление планирует сама система.
import * as Notifications from 'expo-notifications';

export const REMINDERS_SUPPORTED = true;

// Как показывать уведомление, если приложение открыто: баннер, без звука и значка
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Включить ежедневное напоминание. Возвращает 'scheduled' или 'denied' (нет разрешения).
export async function scheduleDailyReminder({ hour, minute, title, body }) {
  let permission = await Notifications.getPermissionsAsync();
  if (!permission.granted && permission.canAskAgain !== false) {
    permission = await Notifications.requestPermissionsAsync();
  }
  if (!permission.granted) return 'denied';

  // У приложения одно напоминание — старое всегда заменяется новым
  await Notifications.cancelAllScheduledNotificationsAsync();
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute },
  });
  return 'scheduled';
}

// Выключить напоминание (также при удалении всех данных)
export async function cancelReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
