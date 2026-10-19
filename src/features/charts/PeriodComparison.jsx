// Сравнение выбранного периода с предыдущим такой же длины.
// Оба периода считаются одинаково (comparePeriods): сравниваются средние по дням.
// Мало данных — честное пояснение; очень разное число дней — предупреждение.
import { View } from 'react-native';

import { AppText, Card } from '@/components';
import { useTranslation } from '@/i18n';
import { formatNumber, formatSignedChange } from '@/lib/format';
import { useTheme } from '@/theme';

import { formatRangeLabel } from './chartFormat';

// comparison — из comparePeriods, range / previousRange — границы периодов, series — из useChartSeries
export function PeriodComparison({ comparison, range, previousRange, series }) {
  const { t, language } = useTranslation();
  const { colors, spacing } = useTheme();
  const withUnit = (text) => (series.unitLabel ? `${text} ${series.unitLabel}` : text);
  const average = (stats) => (stats?.average != null ? withUnit(formatNumber(stats.average, language, series.digits)) : '-');

  const ok = comparison.status === 'ok';
  const tone = ok ? series.toneOf(comparison.difference) : null;

  return (
    <Card style={{ gap: spacing.sm }}>
      <AppText variant="subheading">{t('charts.compare.title')}</AppText>

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <PeriodColumn title={t('charts.compare.previous')} dates={formatRangeLabel(previousRange, language)} value={average(comparison.previous)} />
        <PeriodColumn title={t('charts.compare.current')} dates={formatRangeLabel(range, language)} value={average(comparison.current)} />
      </View>

      {ok ? (
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'baseline',
            gap: spacing.sm,
            paddingTop: spacing.sm,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <AppText variant="caption" color="textSecondary" style={{ flexShrink: 1 }}>
            {t('charts.compare.difference')}
          </AppText>
          <AppText variant="subheading" color={tone ? `${tone}Text` : 'text'}>
            {withUnit(formatSignedChange(comparison.difference, language, series.digits))}
          </AppText>
        </View>
      ) : null}

      {!ok || comparison.uneven ? (
        <AppText variant="caption" color="textSecondary">
          {t(ok ? 'charts.compare.uneven' : 'charts.compare.notEnough')}
        </AppText>
      ) : null}
    </Card>
  );
}

function PeriodColumn({ title, dates, value }) {
  const { t } = useTranslation();
  const { colors, radius, spacing } = useTheme();
  return (
    <View style={{ flex: 1, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surfaceMuted, gap: 2 }}>
      <AppText variant="small" color="textSecondary">
        {title}
      </AppText>
      <AppText variant="small" color="textTertiary">
        {dates}
      </AppText>
      <AppText variant="small" color="textSecondary" style={{ marginTop: spacing.xxs }}>
        {t('charts.compare.average')}
      </AppText>
      <AppText variant="subheading">{value}</AppText>
    </View>
  );
}
