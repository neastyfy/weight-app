// Карточка графика: сам график и подробности выбранной точки
// (дата и время, значение, изменение к предыдущему измерению).
// Пустые состояния: записей нет вовсе — предложение добавить; в периоде пусто — пояснение.
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText, Button, Card, LineChart } from '@/components';
import { dayTitle } from '@/features/measurements/historyHelpers';
import { useTranslation } from '@/i18n';
import { formatNumber, formatSignedChange, formatTime } from '@/lib/format';
import { useTheme } from '@/theme';

import { formatAxisDate } from './chartFormat';

// series — из useChartSeries, points — точки выбранного периода, range — { start, end }
// color — цвет линии (ключ темы): зелёный / красный / жёлтый по изменению за период, иначе основной
export function ChartCard({ series, points, range, bands, footer, color = 'primary' }) {
  const { t, language } = useTranslation();
  const { colors, spacing } = useTheme();
  const [selectedId, setSelectedId] = useState(null);

  if (series.points.length === 0) {
    return (
      <Card style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl }}>
        <Ionicons name="stats-chart-outline" size={40} color={colors.textTertiary} />
        <AppText variant="heading" align="center">
          {t('charts.emptyTitle')}
        </AppText>
        <AppText color="textSecondary" align="center">
          {series.emptyText}
        </AppText>
        {series.addRoute ? (
          <Button title={t('common.add')} icon="add" onPress={() => router.push(series.addRoute)} style={{ alignSelf: 'stretch' }} />
        ) : null}
      </Card>
    );
  }

  if (points.length === 0) {
    return (
      <Card style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl }}>
        <Ionicons name="calendar-outline" size={36} color={colors.textTertiary} />
        <AppText color="textSecondary" align="center">
          {t('charts.emptyPeriod')}
        </AppText>
      </Card>
    );
  }

  // По умолчанию выбрана последняя запись периода
  const selected = points.find((point) => point.id === selectedId) ?? points[points.length - 1];
  const value = (number) => formatNumber(number, language, series.digits);
  const withUnit = (text) => (series.unitLabel ? `${text} ${series.unitLabel}` : text);
  const tone = selected.change != null ? series.toneOf(selected.change) : null;
  const changeColor = tone ? `${tone}Text` : 'textSecondary';

  return (
    <Card style={{ gap: spacing.sm, paddingHorizontal: spacing.md }}>
      {/* Выбранная запись */}
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: spacing.sm }}>
        <View style={{ flexShrink: 1 }}>
          <AppText variant="small" color="textSecondary">
            {`${dayTitle(new Date(selected.date), language, t)}, ${formatTime(selected.date, language)}`}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.xxs }}>
            <AppText variant="number">{value(selected.value)}</AppText>
            {series.unitLabel ? (
              <AppText variant="subheading" color="textSecondary">
                {series.unitLabel}
              </AppText>
            ) : null}
          </View>
        </View>
        <AppText variant="small" color={changeColor} align="right" style={{ flexShrink: 1, marginBottom: 6 }}>
          {selected.change == null
            ? t('charts.firstEver')
            : t('charts.sincePrevious', { value: withUnit(formatSignedChange(selected.change, language, series.digits)) })}
        </AppText>
      </View>

      <LineChart
        points={points}
        start={range.start}
        end={range.end}
        selectedId={selected.id}
        onSelect={(point) => setSelectedId(point.id)}
        formatValue={(tick) => formatNumber(tick, language, 1)}
        formatDate={(date) => formatAxisDate(date, language, range)}
        bands={bands}
        color={color}
      />

      <AppText variant="small" color="textTertiary" align="center">
        {t('charts.selectHint')}
      </AppText>
      {footer}
    </Card>
  );
}
