// Фоновая синхронизация с системой (ничего не рисует), подключена в корне приложения:
//   • iOS-виджет: после изменения веса, цели, профиля или языка записывается новый снимок;
//     после удаления всех данных снимок удаляется — виджет предложит открыть приложение;
//   • напоминание о взвешивании: при смене языка текст уже запланированного уведомления
//     перепланируется на новом языке.
import { useSQLiteContext } from '@/storage/sqlite';
import { useEffect, useRef } from 'react';

import { useMeasurements } from '@/features/measurements/MeasurementsProvider';
import { useProfile } from '@/features/profile';
import { REMINDERS_SUPPORTED, scheduleDailyReminder } from '@/features/reminders/reminders';
import { useTranslation } from '@/i18n';
import { logError } from '@/lib/logError';
import { SETTING_KEYS, getSetting } from '@/storage/settingsRepository';

import { buildWidgetSnapshot } from './widgetSnapshot';
import { WIDGET_SUPPORTED, writeWidgetSnapshot } from './widgetStorage';

export function WidgetSync() {
  const db = useSQLiteContext();
  const { t, language } = useTranslation();
  const { profile, goals, status } = useProfile();
  const { weightEntries, status: measurementsStatus } = useMeasurements();

  // Снимок для виджета — только когда данные загружены (иначе на миг записался бы пустой)
  useEffect(() => {
    if (!WIDGET_SUPPORTED || status !== 'ready' || measurementsStatus === 'loading') return;
    writeWidgetSnapshot(buildWidgetSnapshot({ profile, weightEntries, goals, t, language }));
  }, [profile, weightEntries, goals, t, language, status, measurementsStatus]);

  // Напоминание на новом языке (только при смене языка, не при запуске)
  const previousLanguage = useRef(language);
  useEffect(() => {
    if (!REMINDERS_SUPPORTED || previousLanguage.current === language) return;
    previousLanguage.current = language;
    (async () => {
      const [enabled, time] = await Promise.all([getSetting(db, SETTING_KEYS.reminderEnabled), getSetting(db, SETTING_KEYS.reminderTime)]);
      if (enabled !== 'true' || !/^\d{2}:\d{2}$/.test(time ?? '')) return;
      const [hour, minute] = time.split(':').map(Number);
      await scheduleDailyReminder({ hour, minute, title: t('reminders.notificationTitle'), body: t('reminders.notificationBody') });
    })().catch((error) => logError('Не удалось обновить язык напоминания', error));
  }, [db, language, t]);

  return null;
}
