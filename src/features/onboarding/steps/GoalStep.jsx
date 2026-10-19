// Шаг: целевой вес (необязательный — «Пока без цели»).
// Шкала начинается на 1 кг ниже текущего веса. Ниже — оценка цели,
// которая обновляется прямо во время перетаскивания шкалы.
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';

import { Appear, AppText, ValuePicker } from '@/components';
import { assessGoal } from '@/features/calculations';
import { determineGoalType } from '@/features/goals/goalModel';
import { Mascot } from '@/features/mascots';
import { GoalAssessmentCard } from '@/features/metrics/GoalAssessmentCard';
import { PICKERS } from '@/features/profile';
import { useTranslation } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { fromKg, roundTo, toCm, toKg } from '@/lib/units';
import { useTheme } from '@/theme';

const DEFAULT_GOAL_OFFSET_KG = 1; // начальная цель — на 1 кг ниже текущего веса

export function GoalStep({ draft, update, errors }) {
  const { t, translateError, language } = useTranslation();
  const { spacing } = useTheme();
  const picker = PICKERS.weight[draft.weightUnit];
  const unit = t(`units.${draft.weightUnit}`);
  const onChange = useCallback((targetWeight) => update({ targetWeight }), [update]);

  // Значение под указателем, пока шкалу тянут (для оценки в реальном времени)
  const [preview, setPreview] = useState(null);
  const target = preview ?? draft.targetWeight;

  // Начальное положение шкалы: на 1 кг ниже текущего веса (в пределах шкалы)
  const initialGoal = useMemo(() => {
    if (draft.weight == null) return picker.initial;
    const value = fromKg(toKg(draft.weight, draft.weightUnit) - DEFAULT_GOAL_OFFSET_KG, draft.weightUnit);
    return roundTo(Math.max(picker.min, value), 1);
  }, [draft.weight, draft.weightUnit, picker]);

  const assessment =
    target != null && draft.weight != null && draft.height != null
      ? assessGoal({
          targetWeightKg: toKg(target, draft.weightUnit),
          currentWeightKg: toKg(draft.weight, draft.weightUnit),
          heightCm: toCm(draft.height, draft.heightUnit),
          ageYears: draft.age,
        })
      : null;

  const difference = target != null && draft.weight != null ? Math.abs(target - draft.weight) : null;
  // Тип цели — как он будет сохранён (похудение / набор / удержание)
  const goalType =
    target != null && draft.weight != null
      ? determineGoalType(toKg(target, draft.weightUnit), toKg(draft.weight, draft.weightUnit))
      : null;

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ alignItems: 'center', paddingVertical: spacing.xs }}>
        <Mascot mascotId={draft.mascotId} state="goal" size={120} />
      </View>
      <ValuePicker
        value={draft.targetWeight}
        onChange={onChange}
        onPreview={setPreview}
        {...picker}
        initialValue={initialGoal}
        unit={unit}
        error={translateError(errors.targetWeight)}
      />
      {difference != null ? (
        <Appear variant="fade">
          <AppText variant="caption" color="textSecondary" align="center">
            {t('onboarding.goal.difference', { value: formatNumber(difference, language, 1), unit })}
          </AppText>
          {goalType ? (
            <AppText variant="subheading" align="center">
              {t('goal.typeLabel', { type: t(`goal.types.${goalType}`) })}
            </AppText>
          ) : null}
        </Appear>
      ) : null}
      <GoalAssessmentCard assessment={assessment} />
    </View>
  );
}
