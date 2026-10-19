// Смена цели: целевой вес на линейке с оценкой цели в реальном времени,
// быстрые варианты «Удерживать текущий вес» и «Убрать цель».
// Тип цели (похудение / набор / удержание) определяется автоматически по текущему весу.
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { AppText, Button, Card, Screen, ScreenHeader, ValuePicker } from '@/components';
import { assessGoal } from '@/features/calculations';
import { Mascot } from '@/features/mascots';
import { GoalAssessmentCard } from '@/features/metrics/GoalAssessmentCard';
import { PICKERS, useProfile } from '@/features/profile';
import { useTranslation } from '@/i18n';
import { formatWeight } from '@/lib/format';
import { fromKg, roundTo, toKg } from '@/lib/units';
import { useTheme } from '@/theme';
import { logError } from '@/lib/logError';

import { determineGoalType } from './goalModel';

const DEFAULT_GOAL_OFFSET_KG = 1;

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/');
}

export function GoalEditorScreen() {
  const { t, language } = useTranslation();
  const { colors, spacing } = useTheme();
  const { profile, latestWeight, metrics, setGoal } = useProfile();
  const unit = profile.weightUnit;
  const unitLabel = t(`units.${unit}`);
  const picker = PICKERS.weight[unit];
  const currentKg = latestWeight?.weightKg ?? null;

  // Начальное положение: текущая цель или на 1 кг ниже текущего веса
  const startKg = profile.targetWeightKg ?? (currentKg != null ? currentKg - DEFAULT_GOAL_OFFSET_KG : 70);
  const [targetKg, setTargetKg] = useState(startKg);
  const [previewKg, setPreviewKg] = useState(null);
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  const shownKg = previewKg ?? targetKg;
  const goalType = determineGoalType(shownKg, currentKg);
  const assessment = useMemo(
    () =>
      currentKg != null
        ? assessGoal({ targetWeightKg: shownKg, currentWeightKg: currentKg, heightCm: profile.heightCm, ageYears: metrics.ageYears })
        : null,
    [shownKg, currentKg, profile.heightCm, metrics.ageYears],
  );

  const save = async (goal) => {
    setSaving(true);
    setFailed(false);
    try {
      await setGoal(goal);
      goBack();
    } catch (error) {
      logError('Не удалось сохранить цель', error);
      setFailed(true);
      setSaving(false);
    }
  };

  const displayValue = roundTo(fromKg(targetKg, unit), 1);

  return (
    <Screen pushed>
      <ScreenHeader title={t('goal.editTitle')} showBack />
      <View style={{ alignItems: 'center' }}>
        <Mascot mascotId={profile.mascotId} state="goal" size={130} />
      </View>
      <AppText color="textSecondary" align="center">
        {t('goal.editSubtitle')}
      </AppText>

      <Card style={{ paddingVertical: 24, gap: spacing.md }}>
        <ValuePicker
          value={displayValue}
          onChange={(value) => {
            if (value !== displayValue) setTargetKg(toKg(value, unit));
            setPreviewKg(null);
          }}
          onPreview={(value) => setPreviewKg(toKg(value, unit))}
          {...picker}
          initialValue={displayValue}
          unit={unitLabel}
          fadeColor="surface"
        />
        <AppText variant="subheading" align="center">
          {t('goal.typeLabel', { type: t(`goal.types.${goalType}`) })}
        </AppText>
      </Card>

      <GoalAssessmentCard assessment={assessment} />

      {failed ? (
        <Card style={{ backgroundColor: colors.errorSoft }}>
          <AppText color="errorText">{t('entries.failure.save')}</AppText>
        </Card>
      ) : null}

      <View style={{ gap: spacing.xs }}>
        <Button
          title={saving ? t('common.saving') : t('goal.save')}
          icon="flag"
          disabled={saving}
          onPress={() => save({ targetWeightKg: targetKg })}
        />
        {currentKg != null ? (
          <Button
            title={t('goal.maintainButton', { value: formatWeight(currentKg, unit, language), unit: unitLabel })}
            variant="secondary"
            icon="repeat"
            disabled={saving}
            onPress={() => save({ targetWeightKg: currentKg, goalType: 'maintain' })}
          />
        ) : null}
        {profile.goalType !== 'none' ? (
          <Button
            title={t('goal.remove')}
            variant="text"
            disabled={saving}
            onPress={() => save({ targetWeightKg: null, goalType: 'none' })}
          />
        ) : null}
      </View>
    </Screen>
  );
}
