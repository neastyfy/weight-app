// Прогноз достижения цели по недавней тенденции веса.
// Только чистые функции (тесты: __tests__/goalForecast.test.js).
//
// Как считается:
//   0. Используем только записи текущей цели (как полоса прогресса, см. belongsToGoal),
//      если у цели есть дата начала: после смены цели тенденция считается заново.
//   1. Берём записи за последние 6 недель (окно отсчитывается от последней записи).
//   2. Несколько записей за один день усредняем — одна точка на местный день.
//   3. Наклон тенденции (кг в день) — оценка Тейла — Сена: медиана наклонов по всем
//      парам точек. Медиана почти не реагирует на отдельные «скачки» (вода, соль, праздник),
//      в отличие от обычной прямой по методу наименьших квадратов.
//   4. Разброс точек вокруг тенденции оцениваем медианой отклонений (тоже устойчиво к выбросам)
//      и по нему — погрешность наклона.
//   5. Прогноз: сколько примерно дней осталось при текущем темпе и примерная дата,
//      плюс вероятный диапазон дат — от «быстрого» до «медленного» варианта наклона
//      (наклон ± погрешность). Это оценка, а не обещание.
//   6. Прогноз строится, даже если вес сильно колеблется, темп необычно быстрый или данных
//      немного, — но тогда помечается как очень приблизительный (confidence: 'low'),
//      а диапазон дат шире.
//
// Прогноз не строится, только если дату честно назвать нельзя: цели нет или это удержание,
// цель уже достигнута, записей совсем мало, последняя запись давно, вес стоит на месте
// или идёт от цели, путь дольше двух лет.
// Калории и дефицит калорий не используются — только реальные даты и веса.

import { addDays, dayKey, startOfDay } from '@/lib/dates';

import { belongsToGoal, getGoalProgress } from './goalModel';

const DAY_MS = 24 * 60 * 60 * 1000;

// Настройки прогноза. Тексты подсказок упоминают эти числа («неделя», «4 дня», «две недели», «два года») —
// при изменении поправь и переводы (ключи forecast.*).
export const FORECAST_SETTINGS = {
  windowDays: 42, // тенденция по последним 6 неделям
  minDays: 4, // минимум разных дней с записями в окне
  minSpanDays: 7, // записи должны охватывать хотя бы неделю
  reliableDays: 5, // меньше дней с записями — прогноз приблизительный
  reliableSpanDays: 14, // записи короче двух недель — прогноз приблизительный
  maxAgeDays: 14, // последняя запись не старше 2 недель
  minRateKgPerWeek: 0.02, // медленнее — вес практически стоит на месте
  maxRateKgPerWeek: 1.5, // быстрее — скорее кратковременные колебания: прогноз приблизительный
  minResidualKg: 0.1, // нижняя граница разброса: точность обычных весов
  maxWeeks: 104, // дальше двух лет не прогнозируем
};

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

// Записи → точки { x: день от первой точки, y: средний вес за день }, по возрастанию даты.
// Дни считаются по местному календарю пользователя.
export function toDailyPoints(entries) {
  const days = new Map();
  for (const entry of entries) {
    const key = dayKey(entry.measuredAt);
    const day = days.get(key) ?? { sum: 0, count: 0 };
    day.sum += entry.weightKg;
    day.count += 1;
    days.set(key, day);
  }
  const keys = [...days.keys()].sort();
  if (keys.length === 0) return [];
  // полдень местного дня — чтобы переход на летнее время не сдвигал дни
  const toTime = (key) => {
    const [year, month, day] = key.split('-').map(Number);
    return new Date(year, month - 1, day, 12).getTime();
  };
  const start = toTime(keys[0]);
  return keys.map((key) => {
    const { sum, count } = days.get(key);
    return { x: Math.round((toTime(key) - start) / DAY_MS), y: sum / count };
  });
}

// Устойчивая тенденция по точкам: { slope (кг/день), intercept, standardError } или null
export function getRobustTrend(points, minResidualKg = FORECAST_SETTINGS.minResidualKg) {
  if (points.length < 3) return null;

  // Тейл — Сен: медиана наклонов по всем парам
  const slopes = [];
  for (let i = 0; i < points.length; i += 1) {
    for (let j = i + 1; j < points.length; j += 1) {
      slopes.push((points[j].y - points[i].y) / (points[j].x - points[i].x));
    }
  }
  const slope = median(slopes);
  const intercept = median(points.map((p) => p.y - slope * p.x));

  // Разброс вокруг тенденции: 1,4826 × медиана абсолютных отклонений ≈ стандартное отклонение
  const residuals = points.map((p) => Math.abs(p.y - (intercept + slope * p.x)));
  const spread = Math.max(1.4826 * median(residuals), minResidualKg);
  const meanX = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const sumSquares = points.reduce((sum, p) => sum + (p.x - meanX) ** 2, 0);
  const standardError = spread / Math.sqrt(sumSquares);

  return { slope, intercept, standardError };
}

// Прогноз для цели.
//   entries — записи веса (в любом порядке): { measuredAt, weightKg }
//   goal — { goalType, targetWeightKg }
// Возвращает { status, ... }:
//   'ok'           — { daysLeft (дней от сегодня), expectedDate, earliestDate, latestDate (Date),
//                    rateKgPerWeek, trendWeightKg }
//                    confidence — 'normal' или 'low' (оценка очень приблизительная)
//   'notApplicable' (нет цели или удержание), 'reached', 'notEnoughData', 'stale',
//   'flat', 'awayFromGoal', 'nearGoal', 'tooFar'
export function getGoalForecast({ entries, goal, now = new Date(), settings = FORECAST_SETTINGS }) {
  if (!goal || (goal.goalType !== 'lose' && goal.goalType !== 'gain') || goal.targetWeightKg == null) {
    return { status: 'notApplicable' };
  }
  const goalEntries = goal.startedAt ? (entries ?? []).filter((entry) => belongsToGoal(entry, goal)) : entries ?? [];
  if (!goalEntries.length) return { status: 'notEnoughData' };

  const sorted = [...goalEntries].sort((a, b) => (a.measuredAt < b.measuredAt ? -1 : a.measuredAt > b.measuredAt ? 1 : 0));
  const latest = sorted[sorted.length - 1];

  const progress = getGoalProgress({
    goalType: goal.goalType,
    targetWeightKg: goal.targetWeightKg,
    currentWeightKg: latest.weightKg,
  });
  if (progress === 'reached' || progress === 'exceeded') return { status: 'reached' };

  const latestTime = new Date(latest.measuredAt).getTime();
  if (new Date(now).getTime() - latestTime > settings.maxAgeDays * DAY_MS) return { status: 'stale' };

  const windowStart = latestTime - settings.windowDays * DAY_MS;
  const points = toDailyPoints(sorted.filter((entry) => new Date(entry.measuredAt).getTime() >= windowStart));
  const spanDays = points.length ? points[points.length - 1].x - points[0].x : 0;
  if (points.length < settings.minDays || spanDays < settings.minSpanDays) {
    return { status: 'notEnoughData' };
  }

  const trend = getRobustTrend(points, settings.minResidualKg);
  const rateKgPerWeek = trend.slope * 7;
  if (Math.abs(rateKgPerWeek) < settings.minRateKgPerWeek) return { status: 'flat', rateKgPerWeek };
  const towardsGoal = goal.goalType === 'lose' ? trend.slope < 0 : trend.slope > 0;
  if (!towardsGoal) return { status: 'awayFromGoal', rateKgPerWeek };

  // Сколько осталось от веса «по тенденции» (а не от последнего, случайно высокого или низкого)
  const trendWeightKg = trend.intercept + trend.slope * points[points.length - 1].x;
  const remainingKg = goal.targetWeightKg - trendWeightKg;
  // тенденция уже дошла до цели, хотя последняя запись ещё нет
  if (remainingKg * trend.slope <= 0) return { status: 'nearGoal', rateKgPerWeek, trendWeightKg };

  const speed = Math.abs(trend.slope);
  const distance = Math.abs(remainingKg);
  if (distance / speed > settings.maxWeeks * 7) return { status: 'tooFar', rateKgPerWeek, trendWeightKg };

  // Насколько можно доверять: тенденция заметно сильнее колебаний, темп обычный и данных достаточно
  const reliable =
    speed >= 2 * trend.standardError &&
    Math.abs(rateKgPerWeek) <= settings.maxRateKgPerWeek &&
    points.length >= settings.reliableDays &&
    spanDays >= settings.reliableSpanDays;
  // Медленный вариант: наклон минус погрешность, но не меньше трети наклона —
  // иначе при сильных колебаниях диапазон уходил бы в бесконечность
  const slowSpeed = Math.max(speed - trend.standardError, speed / 3);

  // Дни считаются от дня последней записи (к нему относится вес «по тенденции»).
  const latestDay = startOfDay(latest.measuredAt);
  const today = startOfDay(now);
  const tomorrow = addDays(today, 1);
  // дата через days дней после последней записи, но не раньше завтрашнего дня
  const dateAfter = (days) => {
    const date = addDays(latestDay, Math.round(days));
    return date < tomorrow ? tomorrow : date;
  };
  const expectedDate = dateAfter(distance / speed);
  return {
    status: 'ok',
    confidence: reliable ? 'normal' : 'low',
    daysLeft: Math.round((expectedDate - today) / DAY_MS),
    expectedDate,
    earliestDate: dateAfter(distance / (speed + trend.standardError)),
    latestDate: dateAfter(Math.min(distance / slowSpeed, settings.maxWeeks * 7)),
    rateKgPerWeek,
    trendWeightKg,
  };
}
