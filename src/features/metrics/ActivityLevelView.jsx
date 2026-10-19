// Итог активности: категория, короткая подсказка и цветная шкала из 4 ступеней.
// Пример: <ActivityLevelView level="moderate" />  (level может быть null — «ещё не выбрано»)
import { View } from 'react-native';

import { Appear, AppText, RangeScale } from '@/components';
import { ACTIVITY_LEVELS } from '@/features/calculations';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme';

import { ACTIVITY_TONES } from './metricTones';

const SEGMENTS = ACTIVITY_LEVELS.map((level) => ({ size: 1, tone: ACTIVITY_TONES[level] }));

export function ActivityLevelView({ level, compact = false }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const index = ACTIVITY_LEVELS.indexOf(level);
  const tone = ACTIVITY_TONES[level];

  return (
    <View style={{ gap: compact ? spacing.xxs : spacing.xs }}>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs, flexWrap: 'wrap' }}>
        <AppText variant="small" color="textSecondary">
          {t('onboarding.activity.resultLabel')}:
        </AppText>
        {level ? (
          <Appear key={level} variant="fade">
            <AppText variant={compact ? 'subheading' : 'heading'} color={`${tone}Text`}>
              {t(`activity.levels.${level}`)}
            </AppText>
          </Appear>
        ) : (
          <AppText variant="subheading" color="textTertiary">
            —
          </AppText>
        )}
      </View>
      <RangeScale segments={SEGMENTS} position={index >= 0 ? (index + 0.5) / ACTIVITY_LEVELS.length : null} compact={compact} />
      {level && !compact ? (
        <AppText variant="caption" color="textSecondary">
          {t(`activity.levelHints.${level}`)}
        </AppText>
      ) : null}
    </View>
  );
}
