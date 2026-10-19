import { getValueTicks } from '@/lib/chartTicks';
import { fromCm, fromKg } from '@/lib/units';

import {
  buildSeries,
  comparePeriods,
  getBmiEntries,
  getPeriodRange,
  getPeriodStats,
  getPreviousRange,
  getRangeDays,
  pointsInRange,
} from '../chartModel';

const NOW = new Date(2026, 9, 19, 12, 0); // 19 октября 2026, местное время

// Запись веса: [год, месяц(0-11), день, час, вес]
let nextId = 1;
const weight = (y, m, d, h, kg) => ({ id: nextId++, measuredAt: new Date(y, m, d, h, 0).toISOString(), weightKg: kg });
const series = (entries, convert) => buildSeries(entries, { valueKey: 'weightKg', convert });

describe('границы периодов', () => {
  it('неделя — последние 7 дней включая сегодня', () => {
    const range = getPeriodRange('week', { now: NOW });
    expect(range.start).toEqual(new Date(2026, 9, 13));
    expect(range.end).toEqual(new Date(2026, 9, 20));
    expect(getRangeDays(range)).toBe(7);
  });

  it('месяц и год — с того же числа (+1 день)', () => {
    expect(getPeriodRange('month', { now: NOW }).start).toEqual(new Date(2026, 8, 20));
    expect(getPeriodRange('year', { now: NOW }).start).toEqual(new Date(2025, 9, 20));
  });

  it('произвольный диапазон — включительно, порядок дат не важен', () => {
    const range = getPeriodRange('custom', { now: NOW, from: new Date(2026, 9, 10, 15), to: new Date(2026, 9, 1, 9) });
    expect(range.start).toEqual(new Date(2026, 9, 1));
    expect(range.end).toEqual(new Date(2026, 9, 11));
  });

  it('предыдущий период той же длины вплотную', () => {
    const previous = getPreviousRange(getPeriodRange('week', { now: NOW }));
    expect(previous.start).toEqual(new Date(2026, 9, 6));
    expect(previous.end).toEqual(new Date(2026, 9, 13));
  });

  it('записи на границах: начало первого дня входит, начало следующего после конца — нет', () => {
    const range = getPeriodRange('custom', { from: new Date(2026, 9, 1), to: new Date(2026, 9, 2) });
    const points = series([
      { id: 1, measuredAt: new Date(2026, 8, 30, 23, 59).toISOString(), weightKg: 80 },
      { id: 2, measuredAt: new Date(2026, 9, 1, 0, 0).toISOString(), weightKg: 81 },
      { id: 3, measuredAt: new Date(2026, 9, 2, 23, 59).toISOString(), weightKg: 82 },
      { id: 4, measuredAt: new Date(2026, 9, 3, 0, 0).toISOString(), weightKg: 83 },
    ]);
    expect(pointsInRange(points, range).map((p) => p.id)).toEqual([2, 3]);
  });
});

describe('серия точек', () => {
  it('каждая запись — своя точка, пропуски не заполняются, изменение к предыдущей', () => {
    const points = series([weight(2026, 9, 10, 8, 80), weight(2026, 9, 1, 8, 81), weight(2026, 9, 10, 20, 80.6)]);
    expect(points.map((p) => p.value)).toEqual([81, 80, 80.6]);
    expect(points[0].change).toBeNull();
    expect(points[1].change).toBeCloseTo(-1);
    expect(points[2].change).toBeCloseTo(0.6);
  });

  it('изменение первой точки периода — к записи до периода', () => {
    const points = series([weight(2026, 8, 1, 8, 82), weight(2026, 9, 15, 8, 80)]);
    const inWeek = pointsInRange(points, getPeriodRange('week', { now: NOW }));
    expect(inWeek).toHaveLength(1);
    expect(inWeek[0].change).toBeCloseTo(-2);
  });

  it('единицы: фунты и дюймы считаются из базовых кг и см', () => {
    const pounds = series([weight(2026, 9, 1, 8, 80), weight(2026, 9, 2, 8, 79)], (kg) => fromKg(kg, 'lb'));
    expect(pounds[0].value).toBeCloseTo(176.37, 1);
    expect(getPeriodStats(pounds).change).toBeCloseTo(-2.2, 1);

    const waist = buildSeries([{ id: 1, measuredAt: NOW.toISOString(), valueCm: 80 }], {
      valueKey: 'valueCm',
      convert: (cm) => fromCm(cm, 'in'),
    });
    expect(waist[0].value).toBeCloseTo(31.5, 1);
  });
});

describe('статистика периода', () => {
  it('нет данных и диапазон без измерений', () => {
    expect(getPeriodStats([])).toBeNull();
    const points = series([weight(2026, 5, 1, 8, 80)]);
    expect(getPeriodStats(pointsInRange(points, getPeriodRange('week', { now: NOW })))).toBeNull();
  });

  it('одна запись — без изменения, минимума, максимума и среднего', () => {
    const stats = getPeriodStats(series([weight(2026, 9, 18, 8, 80)]));
    expect(stats).toMatchObject({ count: 1, days: 1, change: null, min: null, max: null, average: null });
    expect(stats.first.value).toBe(80);
    expect(stats.last.value).toBe(80);
  });

  it('несколько записей в один день — изменение есть, среднего нет (день один)', () => {
    const stats = getPeriodStats(series([weight(2026, 9, 18, 7, 80), weight(2026, 9, 18, 21, 81)]));
    expect(stats.count).toBe(2);
    expect(stats.days).toBe(1);
    expect(stats.change).toBeCloseTo(1);
    expect(stats.average).toBeNull();
    expect(stats.min.value).toBe(80);
    expect(stats.max.value).toBe(81);
  });

  it('среднее — по дням, чтобы частые взвешивания в один день не перевешивали', () => {
    const stats = getPeriodStats(
      series([weight(2026, 9, 1, 7, 80), weight(2026, 9, 1, 8, 80), weight(2026, 9, 1, 9, 80), weight(2026, 9, 2, 8, 84)]),
    );
    expect(stats.average).toBeCloseTo(82);
    expect(stats.first.value).toBe(80);
    expect(stats.last.value).toBe(84);
  });
});

describe('сравнение периодов', () => {
  const week = getPeriodRange('week', { now: NOW });
  const previousWeek = getPreviousRange(week);

  it('одинаковые правила для обоих периодов, разница средних', () => {
    const points = series([
      weight(2026, 9, 7, 8, 82),
      weight(2026, 9, 10, 8, 81),
      weight(2026, 9, 14, 8, 80),
      weight(2026, 9, 18, 8, 79),
    ]);
    const result = comparePeriods(pointsInRange(points, week), pointsInRange(points, previousWeek));
    expect(result.status).toBe('ok');
    expect(result.difference).toBeCloseTo(-2);
    expect(result.uneven).toBe(false);
  });

  it('в одном из периодов мало данных — сравнения нет', () => {
    const points = series([weight(2026, 9, 7, 8, 82), weight(2026, 9, 14, 8, 80), weight(2026, 9, 18, 8, 79)]);
    expect(comparePeriods(pointsInRange(points, week), pointsInRange(points, previousWeek)).status).toBe('notEnoughData');
    expect(comparePeriods([], []).status).toBe('notEnoughData');
  });

  it('сильно разное количество дней — предупреждение', () => {
    const current = series([13, 14, 15, 16, 17, 18].map((d) => weight(2026, 9, d, 8, 80)));
    const previous = series([weight(2026, 9, 7, 8, 81), weight(2026, 9, 8, 8, 81)]);
    expect(comparePeriods(current, previous).uneven).toBe(true);
  });
});

describe('история ИМТ', () => {
  const profile = { heightCm: 180, createdAt: new Date(2026, 9, 1, 10).toISOString(), ageYears: 30, ageRecordedAt: NOW.toISOString() };
  const versions = [
    { id: 1, heightCm: 180, effectiveFrom: new Date(2026, 9, 1, 10).toISOString() },
    { id: 2, heightCm: 170, effectiveFrom: new Date(2026, 9, 5, 10).toISOString() },
  ];

  it('рост берётся из версии, действовавшей на дату записи', () => {
    const entries = [weight(2026, 9, 2, 8, 81), weight(2026, 9, 10, 8, 81)];
    const bmi = getBmiEntries(entries, versions, profile);
    expect(bmi[0].bmi).toBeCloseTo(25, 1); // 180 см
    expect(bmi[1].bmi).toBeCloseTo(28, 1); // 170 см — после изменения роста
    expect(bmi.every((e) => !e.heightAssumed)).toBe(true);
  });

  it('до первой версии рост неизвестен — используется первый рост с пометкой', () => {
    const bmi = getBmiEntries([weight(2026, 8, 20, 8, 90)], versions, profile);
    expect(bmi[0].bmi).toBeCloseTo(27.8, 1);
    expect(bmi[0].heightAssumed).toBe(true);
  });

  it('без роста — истории нет', () => {
    expect(getBmiEntries([weight(2026, 9, 10, 8, 81)], [], { ...profile, heightCm: null })).toEqual([]);
  });
});

describe('неполная история окружностей', () => {
  it('у вида окружности может не быть записей в периоде — статистики нет, серия других видов не мешает', () => {
    const body = [
      { id: 1, type: 'waist', measuredAt: new Date(2026, 9, 1, 8).toISOString(), valueCm: 82 },
      { id: 2, type: 'waist', measuredAt: new Date(2026, 9, 15, 8).toISOString(), valueCm: 80 },
      { id: 3, type: 'neck', measuredAt: new Date(2026, 5, 1, 8).toISOString(), valueCm: 38 },
    ];
    const toSeries = (type) => buildSeries(body.filter((m) => m.type === type), { valueKey: 'valueCm' });
    const week = getPeriodRange('week', { now: NOW });
    expect(getPeriodStats(pointsInRange(toSeries('waist'), week)).count).toBe(1);
    expect(getPeriodStats(pointsInRange(toSeries('neck'), week))).toBeNull();
    expect(getPeriodStats(pointsInRange(toSeries('hips'), week))).toBeNull();
    // за месяц у талии две записи — изменение есть
    expect(getPeriodStats(pointsInRange(toSeries('waist'), getPeriodRange('month', { now: NOW }))).change).toBe(-2);
  });
});

describe('деления оси', () => {
  it('ровные значения, охватывающие диапазон', () => {
    const ticks = getValueTicks(78.3, 81.6);
    expect(ticks[0]).toBeLessThanOrEqual(78.3);
    expect(ticks[ticks.length - 1]).toBeGreaterThanOrEqual(81.6);
    expect(ticks).toEqual([78, 80, 82]);
    expect(getValueTicks(80.1, 80.9)).toEqual([80, 80.5, 81]);
  });

  it('одно значение — ось вокруг него', () => {
    const ticks = getValueTicks(80, 80);
    expect(ticks[0]).toBeLessThan(80);
    expect(ticks[ticks.length - 1]).toBeGreaterThan(80);
  });
});
