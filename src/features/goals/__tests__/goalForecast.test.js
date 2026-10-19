import { getGoalForecast, getRobustTrend, toDailyPoints } from '../goalForecast';

const NOW = new Date(2026, 9, 19, 9, 0); // 19 октября 2026, местное время

// Записи «по дням назад»: [[дней назад, вес], …] — утром в 8:00 местного времени
function entries(list, now = NOW) {
  return list.map(([daysAgo, weightKg], index) => ({
    id: index + 1,
    measuredAt: new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysAgo, 8, 0).toISOString(),
    weightKg,
  }));
}

// Ровная тенденция: каждые `step` дней за `days` дней, `ratePerWeek` кг в неделю, до веса `endWeight`
function steadyTrend({ days = 28, step = 2, ratePerWeek, endWeight, noise = [] }) {
  const list = [];
  for (let d = days, i = 0; d >= 0; d -= step, i += 1) {
    list.push([d, endWeight - (ratePerWeek / 7) * d + (noise[i % (noise.length || 1)] ?? 0)]);
  }
  return entries(list);
}

const lose = (targetWeightKg) => ({ goalType: 'lose', targetWeightKg });
const gain = (targetWeightKg) => ({ goalType: 'gain', targetWeightKg });

describe('недостаточно данных', () => {
  it('нет записей', () => {
    expect(getGoalForecast({ entries: [], goal: lose(70), now: NOW }).status).toBe('notEnoughData');
  });

  it('мало дней с записями', () => {
    const data = entries([[10, 80], [5, 79.5], [0, 79]]);
    expect(getGoalForecast({ entries: data, goal: lose(70), now: NOW }).status).toBe('notEnoughData');
  });

  it('много записей, но за короткий период (меньше недели)', () => {
    const data = entries([[5, 80], [4, 79.8], [3, 79.6], [2, 79.4], [1, 79.2], [0, 79]]);
    expect(getGoalForecast({ entries: data, goal: lose(70), now: NOW }).status).toBe('notEnoughData');
  });

  it('несколько записей в один день считаются одним днём', () => {
    const data = entries([[14, 80], [0, 79], [0, 79.1], [0, 78.9], [0, 79], [0, 79.2]]);
    expect(getGoalForecast({ entries: data, goal: lose(70), now: NOW }).status).toBe('notEnoughData');
  });

  it('последняя запись слишком давняя', () => {
    const data = steadyTrend({ ratePerWeek: -0.5, endWeight: 80 }).map((entry) => ({
      ...entry,
      measuredAt: new Date(new Date(entry.measuredAt).getTime() - 30 * 86400000).toISOString(),
    }));
    expect(getGoalForecast({ entries: data, goal: lose(70), now: NOW }).status).toBe('stale');
  });
});

describe('стабильная тенденция к цели', () => {
  it('похудение 0,5 кг в неделю: 5 кг ≈ 70 дней, дата и диапазон дат вокруг', () => {
    const data = steadyTrend({ ratePerWeek: -0.5, endWeight: 80, noise: [0.2, -0.2, 0.1, -0.1, 0] });
    const forecast = getGoalForecast({ entries: data, goal: lose(75), now: NOW });
    expect(forecast.status).toBe('ok');
    expect(forecast.confidence).toBe('normal');
    expect(forecast.rateKgPerWeek).toBeCloseTo(-0.5, 1);
    expect(forecast.daysLeft).toBeGreaterThan(60);
    expect(forecast.daysLeft).toBeLessThan(80);
    // дата = сегодня + daysLeft (местные дни)
    expect(forecast.expectedDate).toEqual(new Date(2026, 9, 19 + forecast.daysLeft));
    expect(forecast.earliestDate < forecast.expectedDate).toBe(true);
    expect(forecast.latestDate > forecast.expectedDate).toBe(true);
  });

  it('дни считаются от сегодня, даже если последняя запись была несколько дней назад', () => {
    const data = steadyTrend({ ratePerWeek: -0.5, endWeight: 80 });
    const today = getGoalForecast({ entries: data, goal: lose(75), now: NOW });
    const later = getGoalForecast({ entries: data, goal: lose(75), now: new Date(2026, 9, 22, 9) });
    expect(later.expectedDate).toEqual(today.expectedDate);
    expect(later.daysLeft).toBe(today.daysLeft - 3);
  });

  it('набор веса', () => {
    const data = steadyTrend({ ratePerWeek: 0.3, endWeight: 55, noise: [0.1, -0.1, 0] });
    const forecast = getGoalForecast({ entries: data, goal: gain(58), now: NOW });
    expect(forecast.status).toBe('ok');
    expect(forecast.rateKgPerWeek).toBeGreaterThan(0);
  });

  it('один «скачок» почти не влияет на тенденцию (устойчивая оценка)', () => {
    const data = steadyTrend({ ratePerWeek: -0.5, endWeight: 80 });
    data[7] = { ...data[7], weightKg: data[7].weightKg + 3 }; // праздничный ужин
    const forecast = getGoalForecast({ entries: data, goal: lose(75), now: NOW });
    expect(forecast.status).toBe('ok');
    expect(forecast.rateKgPerWeek).toBeCloseTo(-0.5, 1);
  });

  it('учитываются только последние 6 недель', () => {
    // давно вес рос, а последние 4 недели снижается
    const old = entries([[90, 70], [80, 72], [70, 74], [60, 76]]);
    const recent = steadyTrend({ ratePerWeek: -0.5, endWeight: 80 });
    const forecast = getGoalForecast({ entries: [...old, ...recent], goal: lose(75), now: NOW });
    expect(forecast.status).toBe('ok');
  });
});

describe('тенденция от цели или без тенденции', () => {
  it('вес растёт при цели похудения — прогноза нет', () => {
    const data = steadyTrend({ ratePerWeek: 0.5, endWeight: 80 });
    expect(getGoalForecast({ entries: data, goal: lose(75), now: NOW }).status).toBe('awayFromGoal');
  });

  it('вес снижается при цели набора — прогноза нет', () => {
    const data = steadyTrend({ ratePerWeek: -0.4, endWeight: 55 });
    expect(getGoalForecast({ entries: data, goal: gain(60), now: NOW }).status).toBe('awayFromGoal');
  });

  it('вес почти не меняется', () => {
    const data = steadyTrend({ ratePerWeek: 0, endWeight: 80, noise: [0.2, -0.2, 0.1, -0.1] });
    expect(getGoalForecast({ entries: data, goal: lose(75), now: NOW }).status).toBe('flat');
  });

  it('сильные колебания — прогноз всё равно есть, но приблизительный и с широким диапазоном', () => {
    const data = steadyTrend({ ratePerWeek: -0.3, endWeight: 80, noise: [1.5, -1.5, 1.2, -1.4, 0.8, -1] });
    const forecast = getGoalForecast({ entries: data, goal: lose(78), now: NOW });
    expect(forecast.status).toBe('ok');
    expect(forecast.confidence).toBe('low');
    expect(forecast.latestDate > forecast.expectedDate).toBe(true);
  });

  it('очень быстрое изменение — прогноз приблизительный', () => {
    const data = steadyTrend({ ratePerWeek: -2.5, endWeight: 80 });
    const forecast = getGoalForecast({ entries: data, goal: lose(70), now: NOW });
    expect(forecast.status).toBe('ok');
    expect(forecast.confidence).toBe('low');
  });

  it('данных немного (4 дня за неделю) — прогноз приблизительный', () => {
    const data = entries([[7, 81], [5, 80.6], [2, 80.3], [0, 80]]);
    const forecast = getGoalForecast({ entries: data, goal: lose(78), now: NOW });
    expect(forecast.status).toBe('ok');
    expect(forecast.confidence).toBe('low');
  });
});

describe('граничные случаи', () => {
  it('удержание и «без цели» — прогноз не нужен', () => {
    const data = steadyTrend({ ratePerWeek: -0.5, endWeight: 80 });
    expect(getGoalForecast({ entries: data, goal: { goalType: 'maintain', targetWeightKg: 80 }, now: NOW }).status).toBe(
      'notApplicable',
    );
    expect(getGoalForecast({ entries: data, goal: { goalType: 'none', targetWeightKg: null }, now: NOW }).status).toBe(
      'notApplicable',
    );
    expect(getGoalForecast({ entries: data, goal: null, now: NOW }).status).toBe('notApplicable');
  });

  it('цель уже достигнута или перевыполнена', () => {
    const data = steadyTrend({ ratePerWeek: -0.5, endWeight: 74.5 });
    expect(getGoalForecast({ entries: data, goal: lose(75), now: NOW }).status).toBe('reached');
    expect(getGoalForecast({ entries: data, goal: lose(74.5), now: NOW }).status).toBe('reached');
  });

  it('по тенденции цель уже рядом, хотя последняя запись чуть выше', () => {
    const data = steadyTrend({ ratePerWeek: -0.5, endWeight: 75 });
    data[data.length - 1] = { ...data[data.length - 1], weightKg: 75.3 };
    expect(getGoalForecast({ entries: data, goal: lose(75.1), now: NOW }).status).toBe('nearGoal');
  });

  it('очень далёкая цель — больше двух лет', () => {
    const data = steadyTrend({ ratePerWeek: -0.15, endWeight: 120 });
    expect(getGoalForecast({ entries: data, goal: lose(80), now: NOW }).status).toBe('tooFar');
  });

  it('не зависит от порядка записей', () => {
    const data = steadyTrend({ ratePerWeek: -0.5, endWeight: 80 });
    const a = getGoalForecast({ entries: data, goal: lose(75), now: NOW });
    const b = getGoalForecast({ entries: [...data].reverse(), goal: lose(75), now: NOW });
    expect(b).toEqual(a);
  });
});

describe('только записи текущей цели', () => {
  it('записи до постановки цели не учитываются; внесённые после — да, даже задним числом', () => {
    const data = steadyTrend({ ratePerWeek: -0.5, endWeight: 80 }).map((entry) => ({ ...entry, createdAt: entry.measuredAt }));
    // цель поставлена 3 дня назад — старых записей для прогноза мало
    const goal = { ...lose(75), startedAt: new Date(2026, 9, 16, 9).toISOString() };
    expect(getGoalForecast({ entries: data, goal, now: NOW }).status).toBe('notEnoughData');
    // те же записи, но внесены после постановки цели (задним числом) — прогноз есть
    const backfilled = data.map((entry) => ({ ...entry, createdAt: new Date(2026, 9, 17, 9).toISOString() }));
    expect(getGoalForecast({ entries: backfilled, goal, now: NOW }).status).toBe('ok');
  });
});

describe('вспомогательные функции', () => {
  it('точки по местным дням со средним весом', () => {
    const points = toDailyPoints(entries([[2, 80], [2, 81], [0, 79]]));
    expect(points).toEqual([
      { x: 0, y: 80.5 },
      { x: 2, y: 79 },
    ]);
  });

  it('тенденция по идеальной прямой', () => {
    const trend = getRobustTrend([
      { x: 0, y: 10 },
      { x: 1, y: 9 },
      { x: 2, y: 8 },
      { x: 3, y: 7 },
    ]);
    expect(trend.slope).toBeCloseTo(-1);
    expect(trend.intercept).toBeCloseTo(10);
  });
});
