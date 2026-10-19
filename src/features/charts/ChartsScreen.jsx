// Вкладка «Графики»: вес, окружности тела и ИМТ за выбранный период,
// сводка за период и сравнение с предыдущим периодом такой же длины.
//
// Как устроено:
//   useChartSeries — готовит точки показателя (данные из провайдеров, единицы пользователя);
//   chartModel — периоды, статистика, сравнение (чистые функции с тестами);
//   ChartCard / PeriodSummary / PeriodComparison — только показ.
import { useMemo, useState } from 'react';

import { AppText, Button, Card, Screen, ScreenHeader, SegmentedControl } from '@/components';
import { useMeasurements } from '@/features/measurements/MeasurementsProvider';
import { BMI_SCALE } from '@/features/metrics/metricTones';
import { useProfile } from '@/features/profile';
import { useTranslation } from '@/i18n';
import { addDays, startOfDay } from '@/lib/dates';
import { getFirstProfileVersion } from '@/features/profile/profileVersions';
import { formatHeight, formatShortDate } from '@/lib/format';
import { useNow } from '@/lib/useNow';
import { useTheme } from '@/theme';

import { BodyTypePicker } from './BodyTypePicker';
import { ChartCard } from './ChartCard';
import { PeriodComparison } from './PeriodComparison';
import { PeriodPicker } from './PeriodPicker';
import { PeriodSummary } from './PeriodSummary';
import { comparePeriods, getPeriodRange, getPeriodStats, getPreviousRange, isAdultForBmi, pointsInRange } from './chartModel';
import { useChartSeries } from './useChartSeries';

const METRICS = ['weight', 'body', 'bmi'];

export function ChartsScreen() {
  const { t, language } = useTranslation();
  const { colors } = useTheme();
  const { profile, profileVersions } = useProfile();
  const { status, reload } = useMeasurements();
  const now = useNow();

  const [metric, setMetric] = useState('weight');
  const [bodyType, setBodyType] = useState('waist');
  const [period, setPeriod] = useState('month');
  // свой диапазон по умолчанию — последние 30 дней
  const [custom, setCustom] = useState(() => ({ from: addDays(startOfDay(new Date()), -29), to: startOfDay(new Date()) }));

  const series = useChartSeries(metric, bodyType);
  const range = useMemo(() => getPeriodRange(period, { now, from: custom.from, to: custom.to }), [period, now, custom]);
  const previousRange = useMemo(() => getPreviousRange(range), [range]);
  const points = useMemo(() => pointsInRange(series.points, range), [series.points, range]);
  const stats = useMemo(() => getPeriodStats(points), [points]);
  const comparison = useMemo(
    () => comparePeriods(points, pointsInRange(series.points, previousRange)),
    [points, series.points, previousRange],
  );

  // Зоны категорий ИМТ на фоне — только для взрослых (для подростков границы другие)
  const adult = metric === 'bmi' && isAdultForBmi(profile, range.start);
  const bands = adult ? BMI_SCALE.segments.map((zone) => ({ from: zone.from, to: zone.to, color: colors[`${zone.tone}Soft`] })) : [];

  // Пояснение под ИМТ: по какому росту посчитано и где рост на дату записи неизвестен
  const firstVersion = getFirstProfileVersion(profileVersions);
  const heightText = (cm) => `${formatHeight(cm, profile.heightUnit, language)} ${t(`units.${profile.heightUnit}`)}`;
  const bmiNote =
    metric === 'bmi' ? (
      <AppText variant="small" color="textTertiary">
        {series.heightChanged ? t('charts.bmiNoteVersions') : t('charts.bmiNote', { height: heightText(profile.heightCm) })}
        {series.heightAssumed && firstVersion
          ? ` ${t('charts.bmiAssumed', { date: formatShortDate(firstVersion.effectiveFrom, language), height: heightText(firstVersion.heightCm) })}`
          : ''}
        {adult ? '' : ` ${t('charts.bmiTeen')}`}
      </AppText>
    ) : null;

  return (
    <Screen withTabBar>
      <ScreenHeader title={t('screens.charts')} />

      <SegmentedControl options={METRICS.map((value) => ({ value, label: t(`charts.metrics.${value}`) }))} value={metric} onChange={setMetric} />
      {metric === 'body' ? <BodyTypePicker value={bodyType} onChange={setBodyType} /> : null}
      <PeriodPicker period={period} onPeriodChange={setPeriod} custom={custom} onCustomChange={setCustom} />

      {status === 'error' ? (
        <Card>
          <AppText variant="subheading">{t('errors.loadTitle')}</AppText>
          <AppText variant="caption" color="textSecondary">
            {t('errors.loadText')}
          </AppText>
          <Button title={t('common.retry')} variant="secondary" icon="refresh" onPress={reload} />
        </Card>
      ) : status === 'loading' ? (
        <Card>
          <AppText color="textSecondary">{t('common.loading')}</AppText>
        </Card>
      ) : (
        <>
          {/* key: при смене показателя или периода выбор точки сбрасывается на последнюю */}
          <ChartCard key={`${metric}-${bodyType}-${range.start.getTime()}-${range.end.getTime()}`} series={series} points={points} range={range} bands={bands} footer={bmiNote} color={series.periodTone(stats) ?? 'primary'} />
          {stats ? <PeriodSummary stats={stats} series={series} /> : null}
          {stats && metric !== 'bmi' ? (
            <PeriodComparison comparison={comparison} range={range} previousRange={previousRange} series={series} />
          ) : null}
        </>
      )}
    </Screen>
  );
}
