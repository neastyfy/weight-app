// Выбор периода: неделя / месяц / год / свой диапазон дат.
// custom — { from, to } (Date) для своего диапазона; меняется через onCustomChange.
import { View } from 'react-native';

import { DateTimeField, SegmentedControl } from '@/components';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme';

import { PERIODS } from './chartModel';

export function PeriodPicker({ period, onPeriodChange, custom, onCustomChange }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();

  return (
    <View style={{ gap: spacing.sm }}>
      <SegmentedControl
        options={PERIODS.map((value) => ({ value, label: t(`charts.periods.${value}`) }))}
        value={period}
        onChange={onPeriodChange}
      />
      {period === 'custom' ? (
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <DateTimeField mode="date" label={t('charts.from')} value={custom.from} onChange={(from) => onCustomChange({ ...custom, from })} />
          </View>
          <View style={{ flex: 1 }}>
            <DateTimeField mode="date" label={t('charts.to')} value={custom.to} onChange={(to) => onCustomChange({ ...custom, to })} />
          </View>
        </View>
      ) : null}
    </View>
  );
}
