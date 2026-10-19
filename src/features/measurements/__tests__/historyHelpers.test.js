import { changesFromPrevious, dayTitle, groupByDay } from '../historyHelpers';

const t = (key) => ({ 'common.today': 'Сегодня', 'common.yesterday': 'Вчера' })[key] ?? key;
const local = (y, m, d, h) => new Date(y, m, d, h).toISOString();

describe('история измерений', () => {
  const entries = [
    // новые сверху, как отдаёт репозиторий
    { id: 4, weightKg: 71.6, measuredAt: local(2026, 9, 19, 20) },
    { id: 3, weightKg: 72.0, measuredAt: local(2026, 9, 19, 7) },
    { id: 2, weightKg: 72.4, measuredAt: local(2026, 9, 17, 7) },
    { id: 1, weightKg: 73.0, measuredAt: local(2026, 9, 1, 7) },
  ];

  it('группирует несколько записей одного дня', () => {
    const days = groupByDay(entries);
    expect(days.map((day) => day.entries.map((e) => e.id))).toEqual([[4, 3], [2], [1]]);
  });

  it('пустая история — пустой список', () => {
    expect(groupByDay([])).toEqual([]);
    expect(changesFromPrevious([], 'weightKg').size).toBe(0);
  });

  it('изменение считается относительно предыдущего измерения по времени', () => {
    const changes = changesFromPrevious(entries, 'weightKg');
    expect(changes.get(4)).toBeCloseTo(-0.4, 10);
    expect(changes.get(3)).toBeCloseTo(-0.4, 10);
    expect(changes.get(2)).toBeCloseTo(-0.6, 10);
    expect(changes.has(1)).toBe(false); // самая ранняя запись — не с чем сравнить
  });

  it('называет сегодня и вчера по-человечески', () => {
    const now = new Date(2026, 9, 19, 12);
    expect(dayTitle(new Date(2026, 9, 19, 7), 'ru', t, now)).toBe('Сегодня');
    expect(dayTitle(new Date(2026, 9, 18, 7), 'ru', t, now)).toBe('Вчера');
    expect(dayTitle(new Date(2026, 9, 1, 7), 'ru', t, now)).toMatch(/1/);
  });
});
