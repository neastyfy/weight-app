// Всплывающее поздравление в момент достижения цели (похудение или набор).
//
// Как работает: компонент живёт в корне приложения и следит за состоянием цели.
// Как только последний вес достигает цели (или перевыполняет её), показывается окно —
// ОДИН раз для каждой цели: id отпразднованной цели сохраняется в настройках.
// Для удержания веса и «без цели» поздравление не показывается.
import { router } from 'expo-router';
import { useSQLiteContext } from '@/storage/sqlite';
import { useEffect, useState } from 'react';
import { Modal, StyleSheet, View, useWindowDimensions } from 'react-native';

import { Appear, AppText, Button, Card } from '@/components';
import { Mascot } from '@/features/mascots';
import { useProfile } from '@/features/profile';
import { useTranslation } from '@/i18n';
import { formatWeight } from '@/lib/format';
import { SETTING_KEYS, getSetting, setSetting } from '@/storage/settingsRepository';
import { useTheme } from '@/theme';
import { logError } from '@/lib/logError';

export function GoalCelebration() {
  const db = useSQLiteContext();
  const { t, language } = useTranslation();
  const { colors, spacing, layout } = useTheme();
  const { profile, goals, latestWeight, goalProgress, setGoal } = useProfile();
  const [celebratedGoalId, setCelebratedGoalId] = useState(undefined); // undefined — ещё не загружено
  const [busy, setBusy] = useState(false);
  const { width: windowWidth } = useWindowDimensions();

  useEffect(() => {
    getSetting(db, SETTING_KEYS.celebratedGoalId)
      .then((value) => setCelebratedGoalId(value ?? null))
      .catch(() => setCelebratedGoalId(null));
  }, [db]);

  const currentGoal = goals[goals.length - 1] ?? null;
  const visible =
    celebratedGoalId !== undefined &&
    currentGoal != null &&
    (currentGoal.goalType === 'lose' || currentGoal.goalType === 'gain') &&
    (goalProgress === 'reached' || goalProgress === 'exceeded') &&
    String(currentGoal.id) !== celebratedGoalId;

  if (!visible) return null;

  // Запомнить, что эту цель уже поздравили
  const markCelebrated = async () => {
    const id = String(currentGoal.id);
    setCelebratedGoalId(id);
    await setSetting(db, SETTING_KEYS.celebratedGoalId, id).catch((error) =>
      logError('Не удалось сохранить отметку поздравления', error),
    );
  };

  const unit = profile.weightUnit;
  const unitLabel = t(`units.${unit}`);
  const target = formatWeight(profile.targetWeightKg, unit, language);
  const beyond = formatWeight(Math.abs(latestWeight.weightKg - profile.targetWeightKg), unit, language);

  const newGoal = async () => {
    await markCelebrated();
    router.push('/goal/edit');
  };

  const maintain = async () => {
    setBusy(true);
    await markCelebrated();
    try {
      await setGoal({ targetWeightKg: latestWeight.weightKg, goalType: 'maintain' });
    } catch (error) {
      logError('Не удалось сохранить цель', error);
    }
    setBusy(false);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={markCelebrated} statusBarTranslucent>
      <View style={[styles.backdrop, { backgroundColor: colors.overlay, padding: layout.screenPadding }]}>
        {/* Ширина задана явно: проценты внутри модального окна в браузере считаются неверно */}
        <Appear variant="pop" style={{ width: Math.min(windowWidth - layout.screenPadding * 2, 420) }}>
          <Card style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl }}>
            <Mascot mascotId={profile.mascotId} state="celebrate" size={180} />
            <AppText variant="title" color="successText" align="center" accessibilityRole="header">
              {t('goal.reachedTitle')}
            </AppText>
            <AppText color="textSecondary" align="center">
              {goalProgress === 'exceeded'
                ? t('goal.exceededText', { target, value: beyond, unit: unitLabel })
                : t('goal.reachedText', { target, unit: unitLabel })}
            </AppText>
            <View style={{ alignSelf: 'stretch', gap: spacing.xs, marginTop: spacing.sm }}>
              <Button title={t('goal.newGoal')} icon="flag" onPress={newGoal} disabled={busy} />
              <Button
                title={t('goal.maintainButton', { value: formatWeight(latestWeight.weightKg, unit, language), unit: unitLabel })}
                variant="secondary"
                icon="repeat"
                disabled={busy}
                onPress={maintain}
              />
              <Button title={t('goal.later')} variant="text" onPress={markCelebrated} disabled={busy} />
            </View>
          </Card>
        </Appear>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    // пружинный «выскок» окна не должен расширять страницу в браузере
    overflow: 'hidden',
  },
});
