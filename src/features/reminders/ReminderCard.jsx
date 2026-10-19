// Напоминание о взвешивании в настройках: включить/выключить и выбрать время.
// iOS — настоящее локальное уведомление каждый день (нужно разрешение).
// Браузер — только пояснение: надёжно доставить уведомление закрытой странице нельзя,
// поэтому переключатель не показывается (не обещаем то, что не сработает).
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';
import { Switch, View } from 'react-native';

import { AppText, Button, Card, PressableScale, Sheet, ValuePicker } from '@/components';
import { useTranslation } from '@/i18n';
import { SETTING_KEYS, getSetting, setSetting } from '@/storage/settingsRepository';
import { useTheme } from '@/theme';
import { logError } from '@/lib/logError';

import { REMINDERS_SUPPORTED, cancelReminders, scheduleDailyReminder } from './reminders';

const DEFAULT_TIME = '08:00';
const pad = (n) => String(n).padStart(2, '0');
const parseTime = (value) => {
  const match = /^(\d{2}):(\d{2})$/.exec(value ?? '');
  const hour = match ? Number(match[1]) : 8;
  const minute = match ? Number(match[2]) : 0;
  return { hour: hour < 24 ? hour : 8, minute: minute < 60 ? minute : 0 };
};

export function ReminderCard() {
  const db = useSQLiteContext();
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const [enabled, setEnabled] = useState(false);
  const [time, setTime] = useState(DEFAULT_TIME);
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState(null); // 'denied' | 'failed'

  useEffect(() => {
    if (!REMINDERS_SUPPORTED) return;
    Promise.all([getSetting(db, SETTING_KEYS.reminderEnabled), getSetting(db, SETTING_KEYS.reminderTime)])
      .then(([savedEnabled, savedTime]) => {
        setEnabled(savedEnabled === 'true');
        if (savedTime) setTime(savedTime);
      })
      .catch((error) => logError('Не удалось загрузить напоминание', error));
  }, [db]);

  if (!REMINDERS_SUPPORTED) {
    return (
      <Card>
        <AppText variant="subheading">{t('reminders.title')}</AppText>
        <AppText variant="caption" color="textSecondary">
          {t('reminders.webUnavailable')}
        </AppText>
      </Card>
    );
  }

  // Включить (или перепланировать на новое время) / выключить
  const apply = async (nextEnabled, nextTime) => {
    setBusy(true);
    setProblem(null);
    try {
      if (nextEnabled) {
        const result = await scheduleDailyReminder({
          ...parseTime(nextTime),
          title: t('reminders.notificationTitle'),
          body: t('reminders.notificationBody'),
        });
        if (result !== 'scheduled') {
          setProblem('denied');
          nextEnabled = false;
        }
      } else {
        await cancelReminders();
      }
      setEnabled(nextEnabled);
      setTime(nextTime);
      await setSetting(db, SETTING_KEYS.reminderEnabled, nextEnabled ? 'true' : 'false');
      await setSetting(db, SETTING_KEYS.reminderTime, nextTime);
    } catch (error) {
      logError('Не удалось изменить напоминание', error);
      setProblem('failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <View style={{ flex: 1 }}>
          <AppText variant="subheading">{t('reminders.title')}</AppText>
          <AppText variant="caption" color="textSecondary">
            {t('reminders.text')}
          </AppText>
        </View>
        <Switch
          value={enabled}
          disabled={busy}
          onValueChange={(value) => apply(value, time)}
          trackColor={{ true: colors.primary, false: colors.surfaceMuted }}
          accessibilityLabel={t('reminders.title')}
        />
      </View>
      {enabled ? (
        <PressableScale
          onPress={() => setPicking(true)}
          accessibilityRole="button"
          style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.xs }}
        >
          <AppText color="textSecondary">{t('reminders.time')}</AppText>
          <AppText variant="subheading" color="primary">
            {time}
          </AppText>
        </PressableScale>
      ) : null}
      {problem ? (
        <AppText variant="caption" color="errorText">
          {t(problem === 'denied' ? 'reminders.denied' : 'data.failed')}
        </AppText>
      ) : null}
      {picking ? <TimeSheet initial={time} onClose={() => setPicking(false)} onDone={(next) => { setPicking(false); apply(true, next); }} /> : null}
    </Card>
  );
}

// Выбор времени: колёса часов и минут (шаг 5 минут)
function TimeSheet({ initial, onClose, onDone }) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const start = parseTime(initial);
  const [hour, setHour] = useState(start.hour);
  const [minute, setMinute] = useState(start.minute - (start.minute % 5));
  return (
    <Sheet visible onClose={onClose} title={t('reminders.time')}>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="small" color="textSecondary">
          {t('datetime.hours')}
        </AppText>
        <ValuePicker compact variant="wheel" value={hour} onChange={setHour} min={0} max={23} step={1} unit="" formatLabel={pad} fadeColor={colors.background} />
        <AppText variant="small" color="textSecondary">
          {t('datetime.minutes')}
        </AppText>
        <ValuePicker compact variant="wheel" value={minute} onChange={setMinute} min={0} max={55} step={5} unit="" formatLabel={pad} fadeColor={colors.background} />
      </View>
      <Button title={t('common.done')} icon="checkmark" onPress={() => onDone(`${pad(hour)}:${pad(minute)}`)} />
    </Sheet>
  );
}
