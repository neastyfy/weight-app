// Серия для выбранного показателя: точки в единицах пользователя и всё, что нужно для показа.
// Данные — из уже загруженных провайдеров (useMeasurements, useProfile): никакого SQL здесь нет.
//
//   metric — 'weight' | 'body' | 'bmi', bodyType — вид окружности ('waist', …)
// Возвращает:
//   points — все точки показателя (по возрастанию времени), см. buildSeries
//   unitLabel — подпись единицы («кг», «см», '' для ИМТ), digits — знаков после запятой
//   toneOf(change) — цвет изменения по цели ('success' | 'error' | 'caution' | null)
//   periodTone(stats) — цвет линии графика за период: как изменился показатель (по цели)
//   heightAssumed / heightChanged (только ИМТ) — для пояснения под графиком
//   emptyText — пояснение, если записей нет вовсе; addRoute — куда вести за первой записью (или null)
import { useMemo } from 'react';

import { useMeasurements } from '@/features/measurements/MeasurementsProvider';
import { getChangeTone, getMaintainTone } from '@/features/metrics/changeTone';
import { useProfile } from '@/features/profile';
import { useTranslation } from '@/i18n';
import { fromCm, fromKg, toKg } from '@/lib/units';

import { buildSeries, getBmiEntries } from './chartModel';

export function useChartSeries(metric, bodyType) {
  const { t } = useTranslation();
  const { profile, profileVersions } = useProfile();
  const { weightEntries, bodyMeasurements } = useMeasurements();
  const { weightUnit, heightUnit, goalType, targetWeightKg } = profile;

  // ИМТ — с ростом на дату каждой записи (версии профиля)
  const bmiEntries = useMemo(
    () => (metric === 'bmi' ? getBmiEntries(weightEntries, profileVersions, profile) : []),
    [metric, weightEntries, profileVersions, profile],
  );

  const points = useMemo(() => {
    if (metric === 'weight') {
      return buildSeries(weightEntries, { valueKey: 'weightKg', convert: (kg) => fromKg(kg, weightUnit) });
    }
    if (metric === 'body') {
      const entries = bodyMeasurements.filter((m) => m.type === bodyType);
      return buildSeries(entries, { valueKey: 'valueCm', convert: (cm) => fromCm(cm, heightUnit) });
    }
    return buildSeries(bmiEntries, { valueKey: 'bmi' });
  }, [metric, bodyType, weightEntries, bodyMeasurements, weightUnit, heightUnit, bmiEntries]);

  if (metric === 'weight') {
    return {
      points,
      unitLabel: t(`units.${weightUnit}`),
      digits: 1,
      // при удержании изменение за период не оцениваем цветом — важна близость к цели (она на Главной)
      toneOf: (change) => (goalType === 'lose' || goalType === 'gain' ? getChangeTone(change, goalType) : null),
      // удержание — по отклонению последнего веса периода от цели (зелёный / жёлтый / красный)
      periodTone: (stats) =>
        goalType === 'maintain' && targetWeightKg != null && stats
          ? getMaintainTone(toKg(stats.last.value, weightUnit), targetWeightKg)
          : stats?.change != null && (goalType === 'lose' || goalType === 'gain')
            ? getChangeTone(stats.change, goalType)
            : null,
      emptyText: t('charts.emptyWeight'),
      addRoute: '/weight/new',
    };
  }
  if (metric === 'body') {
    return {
      points,
      unitLabel: t(`units.${heightUnit}`),
      digits: 1,
      // как в истории окружностей
      toneOf: (change) => getChangeTone(change, goalType),
      periodTone: (stats) => (stats?.change != null ? getChangeTone(stats.change, goalType) : null),
      emptyText: t('charts.emptyBody'),
      addRoute: `/body/${bodyType}/new`,
    };
  }
  return {
    points,
    unitLabel: '',
    digits: 1,
    toneOf: () => null,
    periodTone: () => null,
    emptyText: t('charts.emptyBmi'),
    addRoute: '/weight/new',
    // есть ли записи, для которых рост на их дату неизвестен (до создания профиля)
    heightAssumed: bmiEntries.some((entry) => entry.heightAssumed),
    heightChanged: new Set(profileVersions.map((version) => version.heightCm)).size > 1,
  };
}
