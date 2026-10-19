// Шаг: единицы измерения. Уже введённые числа пересчитываются в новые единицы.
import { View } from 'react-native';

import { AppText, Card, SegmentedControl } from '@/components';
import { changeDraftHeightUnit, changeDraftWeightUnit } from '@/features/profile';
import { useTranslation } from '@/i18n';
import { HEIGHT_UNITS, WEIGHT_UNITS } from '@/lib/units';
import { useTheme } from '@/theme';

export function UnitsStep({ draft, update }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();

  const toOptions = (units) => units.map((unit) => ({ value: unit, label: t(`unitNames.${unit}`) }));

  return (
    <Card style={{ gap: spacing.md }}>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="subheading">{t('onboarding.units.weight')}</AppText>
        <SegmentedControl
          options={toOptions(WEIGHT_UNITS)}
          value={draft.weightUnit}
          onChange={(unit) => update((current) => changeDraftWeightUnit(current, unit))}
        />
      </View>
      <View style={{ gap: spacing.xs }}>
        <AppText variant="subheading">{t('onboarding.units.height')}</AppText>
        <SegmentedControl
          options={toOptions(HEIGHT_UNITS)}
          value={draft.heightUnit}
          onChange={(unit) => update((current) => changeDraftHeightUnit(current, unit))}
        />
      </View>
    </Card>
  );
}
