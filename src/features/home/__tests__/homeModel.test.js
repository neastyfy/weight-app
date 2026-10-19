import { getGreetingStatus, getStreak, getWeightSummary, pickPhraseIndex } from '../homeModel';

const NOW = new Date(2026, 9, 19, 12, 0);
const at = (daysAgo, hour = 8) => new Date(2026, 9, 19 - daysAgo, hour).toISOString();

describe('сводка по весу', () => {
  it('нет записей', () => {
    expect(getWeightSummary([])).toEqual({
      latest: null,
      previous: null,
      first: null,
      changeFromPrevious: null,
      changeFromFirst: null,
    });
  });

  it('одна запись — изменений нет', () => {
    const summary = getWeightSummary([{ id: 1, weightKg: 80, measuredAt: at(0) }]);
    expect(summary.latest.weightKg).toBe(80);
    expect(summary.changeFromPrevious).toBeNull();
    expect(summary.changeFromFirst).toBeNull();
  });

  it('изменения к прошлой и к первой записи', () => {
    const summary = getWeightSummary([
      { id: 3, weightKg: 78, measuredAt: at(0) },
      { id: 2, weightKg: 79, measuredAt: at(3) },
      { id: 1, weightKg: 81, measuredAt: at(10) },
    ]);
    expect(summary.changeFromPrevious).toBeCloseTo(-1);
    expect(summary.changeFromFirst).toBeCloseTo(-3);
    expect(summary.first.id).toBe(1);
  });
});

describe('мотивирующая фраза', () => {
  it('не повторяет прошлую', () => {
    for (let previous = 0; previous < 5; previous += 1) {
      for (const r of [0, 0.3, 0.6, 0.99]) {
        const index = pickPhraseIndex(5, previous, () => r);
        expect(index).not.toBe(previous);
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(5);
      }
    }
  });

  it('без прошлой — любая', () => {
    expect(pickPhraseIndex(5, null, () => 0.99)).toBe(3);
    expect(pickPhraseIndex(1, 0)).toBe(0);
  });
});

describe('стрик по дням', () => {
  // запись, внесённая в тот же день (createdAt = measuredAt)
  const entry = (daysAgo, hour = 8) => ({ id: daysAgo * 100 + hour, weightKg: 80, measuredAt: at(daysAgo, hour), createdAt: at(daysAgo, hour) });
  // запись задним числом: датирована daysAgo, а внесена сегодня
  const backdated = (daysAgo) => ({ ...entry(daysAgo), createdAt: at(0, 10) });
  const states = (streak) => streak.week.map((day) => day.state);

  it('нет записей', () => {
    const streak = getStreak([], { now: NOW });
    expect(streak).toMatchObject({ current: 0, best: 0, weighedToday: false });
    expect(states(streak)).toEqual(['missed', 'missed', 'missed', 'missed', 'missed', 'missed', 'pending']);
  });

  it('серия, включая сегодня; несколько записей в день — один день; пропуск — красный', () => {
    const streak = getStreak([entry(0, 7), entry(0, 21), entry(1), entry(2), entry(4)], { now: NOW });
    expect(streak.current).toBe(3);
    expect(streak.weighedToday).toBe(true);
    expect(states(streak)).toEqual(['missed', 'missed', 'done', 'missed', 'done', 'done', 'done']);
  });

  it('сегодня ещё не взвешивались — серия до вчера не обрывается, сегодня не пропуск', () => {
    const streak = getStreak([entry(1), entry(2)], { now: NOW });
    expect(streak.current).toBe(2);
    expect(streak.weighedToday).toBe(false);
    expect(states(streak)[6]).toBe('pending');
  });

  it('запись задним числом не засчитывается — день остаётся пропущенным', () => {
    const streak = getStreak([entry(0), backdated(1), entry(2)], { now: NOW });
    expect(streak.current).toBe(1);
    expect(streak.best).toBe(1);
    expect(states(streak).slice(4)).toEqual(['done', 'missed', 'done']);
  });

  it('дни до создания профиля — без цвета', () => {
    const streak = getStreak([entry(1), entry(0)], { now: NOW, profileCreatedAt: at(1, 7) });
    expect(states(streak)).toEqual(['beforeStart', 'beforeStart', 'beforeStart', 'beforeStart', 'beforeStart', 'done', 'done']);
    // день создания профиля без записи — уже пропуск
    expect(getStreak([entry(0)], { now: NOW, profileCreatedAt: at(1, 7) }).week[5].state).toBe('missed');
  });

  it('пропуск вчера и сегодня — серия 0, рекорд сохраняется', () => {
    const streak = getStreak([entry(2), entry(10), entry(11), entry(12), entry(13)], { now: NOW });
    expect(streak.current).toBe(0);
    expect(streak.best).toBe(4);
  });

  it('серия через начало месяца', () => {
    const streak = getStreak([entry(18), entry(19), entry(20)], { now: NOW }); // 29.09 – 1.10
    expect(streak.best).toBe(3);
  });
});

describe('строка под приветствием', () => {
  const lose = { goalType: 'lose', targetWeightKg: 70 };
  const status = (list, extra = {}) =>
    getGreetingStatus({ summary: getWeightSummary(list), goal: lose, goalProgress: 'inProgress', timeOfDay: 'day', now: NOW, ...extra });

  it('цель достигнута', () => {
    expect(status([{ id: 1, weightKg: 70, measuredAt: at(3) }], { goalProgress: 'reached' })).toBe('reached');
  });

  it('свежая запись к цели — прогресс', () => {
    expect(status([{ id: 2, weightKg: 79.5, measuredAt: at(1) }, { id: 1, weightKg: 80, measuredAt: at(3) }])).toBe('progress');
  });

  it('вес вырос сегодня — без упрёка: «запись есть»', () => {
    expect(status([{ id: 2, weightKg: 80.5, measuredAt: at(0) }, { id: 1, weightKg: 80, measuredAt: at(3) }])).toBe('logged');
  });

  it('нет записи сегодня: днём — напоминание, вечером — «хорошего вечера»', () => {
    expect(status([])).toBe('reminder');
    expect(status([], { timeOfDay: 'night' })).toBe('evening');
    expect(status([{ id: 1, weightKg: 80, measuredAt: at(5) }])).toBe('reminder');
  });
});
