// Карточка оценки целевого веса: цветной заголовок, пояснение и ИМТ при цели на шкале зон.
// Пример: <GoalAssessmentCard assessment={assessGoal({...})} />
import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';

import { Appear, AppText, RangeScale } from '@/components';
import { useTranslation } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { useTheme } from '@/theme';

import { BMI_SCALE, getBmiScalePosition } from './metricTones';

const TONE_ICONS = {
  success: 'checkmark-circle',
  caution: 'alert-circle',
  warning: 'warning',
  error: 'warning',
  primary: 'information-circle',
};

const BMI_SEGMENTS = BMI_SCALE.segments.map((zone) => ({ size: zone.to - zone.from, tone: zone.tone }));

export function GoalAssessmentCard({ assessment }) {
  const { t, language } = useTranslation();
  const { colors, radius, spacing } = useTheme();
  if (!assessment) return null;

  const { id, tone, targetBmi } = assessment;
  const accent = tone === 'primary' ? colors.primary : colors[`${tone}Text`];

  return (
    <View
      style={{
        backgroundColor: colors[`${tone}Soft`],
        borderRadius: radius.lg,
        padding: spacing.md,
        gap: spacing.sm,
      }}
      accessibilityLiveRegion="polite"
    >
      <Appear key={id} variant="fade" style={{ gap: spacing.xxs }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
          <Ionicons name={TONE_ICONS[tone]} size={22} color={accent} />
          <AppText variant="subheading" color={accent} style={{ flex: 1 }}>
            {t(`goalAssessment.${id}.title`)}
          </AppText>
        </View>
        <AppText variant="caption" color="textSecondary">
          {t(`goalAssessment.${id}.text`)}
        </AppText>
      </Appear>

      {id !== 'teen' ? (
        <View style={{ gap: spacing.xxs }}>
          <AppText variant="small" color="textSecondary">
            {t('goalAssessment.targetBmi', { value: formatNumber(targetBmi, language, 1) })}
          </AppText>
          <RangeScale compact segments={BMI_SEGMENTS} position={getBmiScalePosition(targetBmi)} />
        </View>
      ) : null}
    </View>
  );
}
