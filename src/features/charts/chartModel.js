// Данные для графиков и статистики — только чистые функции (тесты: __tests__/chartModel.test.js).
//
// Главные правила:
//   • точка графика = реальная запись из базы, с её настоящей датой и временем;
//   • пропущенные дни ничем не заполняются, несколько записей за день — несколько точек;
//   • значения переводятся в единицы пользователя один раз, при построении серии (convert);
//   • если для показателя мало данных, возвращается null — экран покажет пояснение, а не выдумку.
//
// Даты периодов — местные дни пользователя. Период — полуинтервал [start, end):
// start — начало первого дня, end — начало дня после последнего.

import { calculateBmi, getCurrentAge } from '@/features/calculations';
import { findProfileVersionAt, getFirstProfileVersion } from '@/features/profile/profileVersions';
import { addDays, dayKey, startOfDay } from '@/lib/dates';

const DAY_MS = 24 * 60 * 60 * 1000;

export const PERIODS = ['week', 'month', 'year', 'custom'];

// Границы периода, заканчивающегося сегодня (включительно):
//   week — последние 7 дней, month — с того же числа месяц назад (+1 день), year — так же за год,
//   custom — с from по to включительно (порядок дат не важен).
export function getPeriodRange(period, { now = new Date(), from = null, to = null } = {}) {
  const today = startOfDay(now);
  const end = addDays(today, 1);
  switch (period) {
    case 'week':
      return { start: addDays(today, -6), end };
    case 'month':
      return { start: addDays(new Date(today.getFullYear(), today.getMonth() - 1, today.getDate()), 1), end };
    case 'year':
      return { start: addDays(new Date(today.getFullYear() - 1, today.getMonth(), today.getDate()), 1), end };
    case 'custom': {
      const a = startOfDay(from ?? today);
      const b = startOfDay(to ?? today);
      const [first, last] = a <= b ? [a, b] : [b, a];
      return { start: first, end: addDays(last, 1) };
    }
    default:
      throw new Error(`Неизвестный период: ${period}`);
  }
}

// Сколько местных дней в периоде
export function getRangeDays({ start, end }) {
  return Math.round((startOfDay(end) - startOfDay(start)) / DAY_MS);
}

// Предыдущий период той же длины в днях, вплотную перед выбранным
export function getPreviousRange(range) {
  const days = getRangeDays(range);
  return { start: addDays(range.start, -days), end: range.start };
}

// Последний день периода (для подписи «по …»)
export function getRangeLastDay({ end }) {
  return addDays(end, -1);
}

// Серия точек из записей (в любом порядке), по возрастанию времени:
//   { id, time (мс), date (ISO), value (в единицах показа), change (к предыдущей записи или null) }.
// change считается по ВСЕЙ истории — у первой точки периода тоже есть изменение,
// если до периода была запись.
//   valueKey — поле со значением ('weightKg', 'valueCm'), convert — перевод в единицы пользователя
export function buildSeries(entries, { valueKey, convert = (value) => value }) {
  const sorted = [...entries].sort((a, b) =>
    a.measuredAt !== b.measuredAt ? (a.measuredAt < b.measuredAt ? -1 : 1) : (a.id ?? 0) - (b.id ?? 0),
  );
  let previous = null;
  return sorted.map((entry) => {
    const value = convert(entry[valueKey]);
    const point = {
      id: entry.id,
      time: new Date(entry.measuredAt).getTime(),
      date: entry.measuredAt,
      value,
      change: previous == null ? null : value - previous,
    };
    previous = value;
    return point;
  });
}

// Точки внутри периода: start ≤ время < end
export function pointsInRange(points, { start, end }) {
  const from = start.getTime();
  const to = end.getTime();
  return points.filter((point) => point.time >= from && point.time < to);
}

// Статистика по точкам периода (значения уже в единицах показа). null — точек нет.
//   count — записей, days — разных дней с записями,
//   first / last — первая и последняя запись,
//   min / max — точки с наименьшим и наибольшим значением (только при 2+ записях),
//   change — last − first (только при 2+ записях; это факт, а не прогноз),
//   average — среднее по дням (сначала среднее за каждый день, потом между днями),
//             только если дней с записями 2 и больше — иначе оно ничего не добавляет.
//   Среднее по дням нужно, чтобы пять взвешиваний за один день не перевешивали остальные.
export function getPeriodStats(points) {
  if (!points.length) return null;
  const sorted = [...points].sort((a, b) => a.time - b.time);
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const byDay = new Map();
  for (const point of sorted) {
    const key = dayKey(point.time);
    const day = byDay.get(key) ?? { sum: 0, count: 0 };
    day.sum += point.value;
    day.count += 1;
    byDay.set(key, day);
  }
  const dailyMeans = [...byDay.values()].map((day) => day.sum / day.count);

  const several = sorted.length >= 2;
  let min = null;
  let max = null;
  if (several) {
    for (const point of sorted) {
      if (!min || point.value < min.value) min = point;
      if (!max || point.value > max.value) max = point;
    }
  }

  return {
    count: sorted.length,
    days: byDay.size,
    first,
    last,
    min,
    max,
    change: several ? last.value - first.value : null,
    average: byDay.size >= 2 ? dailyMeans.reduce((sum, value) => sum + value, 0) / dailyMeans.length : null,
  };
}

// Сравнение двух периодов по одинаковым правилам (getPeriodStats для обоих).
// Сравниваем средние по дням: они меньше зависят от того, в какие дни взвешивались.
//   status: 'ok' — { current, previous, difference (current.average − previous.average), uneven }
//           'notEnoughData' — в одном из периодов меньше 2 дней с записями
//   uneven — дней с записями в периодах сильно разное количество (в 3+ раза):
//            сравнение возможно, но приблизительное — экран предупредит.
export function comparePeriods(currentPoints, previousPoints) {
  const current = getPeriodStats(currentPoints);
  const previous = getPeriodStats(previousPoints);
  if (current?.average == null || previous?.average == null) {
    return { status: 'notEnoughData', current, previous };
  }
  const fewer = Math.min(current.days, previous.days);
  const more = Math.max(current.days, previous.days);
  return {
    status: 'ok',
    current,
    previous,
    difference: current.average - previous.average,
    uneven: more >= fewer * 3,
  };
}

// История ИМТ по всем записям веса — с ростом, который действовал на дату каждой записи
// (версии профиля, см. src/features/profile/profileVersions.js).
// Для записей раньше первой версии (внесённых задним числом до создания профиля) рост
// неизвестен: используется первый указанный рост, а запись помечается heightAssumed —
// экран прямо пишет об этом под графиком.
// Возвращает записи-«двойники» с полями bmi и heightAssumed — их можно передать в buildSeries({ valueKey: 'bmi' }).
export function getBmiEntries(weightEntries, profileVersions, profile) {
  const first = getFirstProfileVersion(profileVersions);
  return weightEntries
    .map((entry) => {
      const version = findProfileVersionAt(profileVersions, entry.measuredAt);
      const heightCm = version?.heightCm ?? first?.heightCm ?? profile?.heightCm ?? null;
      return { ...entry, bmi: calculateBmi(entry.weightKg, heightCm), heightAssumed: !version };
    })
    .filter((entry) => entry.bmi != null);
}

// Взрослые ли границы ИМТ подходят для всего периода (на момент самой ранней точки 18+)
export function isAdultForBmi(profile, fromDate) {
  const age = getCurrentAge(profile.ageYears, profile.ageRecordedAt, fromDate);
  return age != null && age >= 18;
}
