// Итоговый шаг: все введённые данные; нажатие на строку открывает нужный шаг для правки.
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, PressableScale } from '@/components';
import { getActivityLevel } from '@/features/calculations';
import { determineGoalType } from '@/features/goals/goalModel';
import { Mascot } from '@/features/mascots';
import { useTranslation } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { toKg } from '@/lib/units';
import { useTheme } from '@/theme';

export function SummaryStep({ draft, onEdit, saveError }) {
  const { t, language } = useTranslation();
  const { colors, spacing } = useTheme();

  const weightUnit = t(`units.${draft.weightUnit}`);
  const heightUnit = t(`units.${draft.heightUnit}`);
  const activityLevel = getActivityLevel(draft.activityAnswers);
  const number = (value, digits) => formatNumber(value, language, digits);
  // Тип цели — по введённому целевому и текущему весу (как он будет сохранён)
  const goalType = determineGoalType(
    draft.targetWeight == null ? null : toKg(draft.targetWeight, draft.weightUnit),
    draft.weight == null ? null : toKg(draft.weight, draft.weightUnit),
  );

  // [подпись, значение, шаг для правки]
  const rows = [
    ['nickname', draft.nickname.trim(), 'name'],
    ['mascot', t(`mascots.${draft.mascotId}.name`), 'mascot'],
    ['units', `${weightUnit} · ${heightUnit}`, 'units'],
    ['height', `${number(draft.height, 1)} ${heightUnit}`, 'height'],
    ['weight', `${number(draft.weight, 1)} ${weightUnit}`, 'weight'],
    ['age', number(draft.age, 0), 'age'],
    ['sex', draft.sex ? t(`onboarding.sex.${draft.sex}`) : t('common.notSpecified'), 'sex'],
    ['activity', activityLevel ? t(`activity.levels.${activityLevel}`) : '-', 'activity'],
    ['goal', draft.targetWeight != null ? `${number(draft.targetWeight, 1)} ${weightUnit}` : t('common.notSpecified'), 'goal'],
    ['goalType', t(`goal.types.${goalType}`), 'goal'],
  ];

  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ alignItems: 'center' }}>
        <Mascot mascotId={draft.mascotId} state="watching_down" size={160} />
      </View>

      <Card style={{ gap: 0, paddingVertical: spacing.xs }}>
        {rows.map(([field, value, stepId], index) => (
          <PressableScale
            key={field}
            onPress={() => onEdit(stepId)}
            scaleTo={0.98}
            accessibilityRole="button"
            accessibilityHint={t('common.edit')}
            style={[
              styles.row,
              { paddingVertical: spacing.sm, gap: spacing.sm },
              index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
            ]}
          >
            <AppText color="textSecondary" style={styles.label}>
              {t(`onboarding.fields.${field}`)}
            </AppText>
            <AppText variant="subheading" align="right" style={styles.value} numberOfLines={2}>
              {value}
            </AppText>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </PressableScale>
        ))}
      </Card>

      {saveError ? (
        <Card style={{ backgroundColor: colors.errorSoft }}>
          <AppText color="error">{t('errors.saveFailed')}</AppText>
        </Card>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    flexShrink: 0,
  },
  value: {
    flex: 1,
  },
});
