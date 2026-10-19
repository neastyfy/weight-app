// Сводка за выбранный период: первое и последнее измерение, минимум и максимум,
// изменение, количество записей и среднее по дням. Показатель, для которого мало данных,
// не показывается (а не заменяется выдуманным числом) — см. getPeriodStats.
import { View } from 'react-native';

import { AppText, Card } from '@/components';
import { useTranslation } from '@/i18n';
import { formatNumber, formatShortDate, formatSignedChange } from '@/lib/format';
import { useTheme } from '@/theme';

// stats — из getPeriodStats (не null), series — из useChartSeries
export function PeriodSummary({ stats, series }) {
  const { t, language } = useTranslation();
  const { spacing } = useTheme();
  const value = (number) => formatNumber(number, language, series.digits);
  const withUnit = (text) => (series.unitLabel ? `${text} ${series.unitLabel}` : text);
  const tone = stats.change != null ? series.toneOf(stats.change) : null;

  // Плитки по две в ряд; null — плитка не показывается
  const tiles = [
    { key: 'first', value: withUnit(value(stats.first.value)), caption: formatShortDate(stats.first.date, language) },
    { key: 'last', value: withUnit(value(stats.last.value)), caption: formatShortDate(stats.last.date, language) },
    stats.min ? { key: 'min', value: withUnit(value(stats.min.value)), caption: formatShortDate(stats.min.date, language) } : null,
    stats.max ? { key: 'max', value: withUnit(value(stats.max.value)), caption: formatShortDate(stats.max.date, language) } : null,
    stats.change != null
      ? { key: 'change', value: withUnit(formatSignedChange(stats.change, language, series.digits)), color: tone ? `${tone}Text` : 'text' }
      : null,
    { key: 'count', value: formatNumber(stats.count, language) },
    stats.average != null ? { key: 'average', value: withUnit(value(stats.average)) } : null,
  ].filter(Boolean);

  return (
    <Card style={{ gap: spacing.sm }}>
      <AppText variant="subheading">{t('charts.summary.title')}</AppText>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: spacing.sm }}>
        {tiles.map((tile) => (
          <View key={tile.key} style={{ width: '50%', paddingRight: spacing.sm }}>
            <AppText variant="small" color="textSecondary">
              {t(`charts.summary.${tile.key}`)}
            </AppText>
            <AppText variant="subheading" color={tile.color ?? 'text'}>
              {tile.value}
            </AppText>
            {tile.caption ? (
              <AppText variant="small" color="textTertiary">
                {tile.caption}
              </AppText>
            ) : null}
          </View>
        ))}
      </View>
      {stats.count < 2 ? (
        <AppText variant="caption" color="textSecondary">
          {t('charts.summary.fewEntries')}
        </AppText>
      ) : null}
    </Card>
  );
}
