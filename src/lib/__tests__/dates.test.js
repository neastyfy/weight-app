import { addDays, combineDateAndTime, dayKey, getMonthGrid, isSameDay, isValidDate, sortByMeasuredAtDesc, toIsoString } from '../dates';

describe('даты', () => {
  it('единый формат хранения — ISO в UTC одинаковой длины', () => {
    const iso = toIsoString(new Date(2026, 0, 5, 8, 30));
    expect(iso).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    expect(toIsoString(iso)).toBe(iso);
  });

  it('проверяет корректность дат', () => {
    expect(isValidDate('2026-10-19T07:30:00.000Z')).toBe(true);
    expect(isValidDate('нет')).toBe(false);
    expect(isValidDate(new Date('x'))).toBe(false);
  });

  it('собирает дату из местного дня и времени', () => {
    const date = combineDateAndTime(new Date(2026, 9, 19), 7, 45);
    expect(date.getHours()).toBe(7);
    expect(date.getMinutes()).toBe(45);
    expect(date.getDate()).toBe(19);
  });

  it('дни: сравнение, ключ и сдвиг', () => {
    expect(isSameDay(new Date(2026, 9, 19, 1), new Date(2026, 9, 19, 23))).toBe(true);
    expect(isSameDay(new Date(2026, 9, 19), new Date(2026, 9, 20))).toBe(false);
    expect(dayKey(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(dayKey(addDays(new Date(2026, 0, 31), 1))).toBe('2026-02-01');
  });

  it('сортирует по реальной дате измерения, а не по порядку добавления', () => {
    const entries = [
      { id: 1, measuredAt: '2026-10-19T06:00:00.000Z' },
      { id: 2, measuredAt: '2026-10-10T06:00:00.000Z' }, // добавлена задним числом
      { id: 3, measuredAt: '2026-10-19T18:00:00.000Z' },
      { id: 4, measuredAt: '2026-10-19T18:00:00.000Z' }, // то же время — выше та, что новее
    ];
    expect(sortByMeasuredAtDesc(entries).map((e) => e.id)).toEqual([4, 3, 1, 2]);
  });

  it('строит сетку месяца с понедельника', () => {
    const weeks = getMonthGrid(2026, 9); // октябрь 2026, 1-е — четверг
    expect(weeks[0].slice(0, 3)).toEqual([null, null, null]);
    expect(weeks[0][3].getDate()).toBe(1);
    expect(weeks.flat().filter(Boolean)).toHaveLength(31);
    weeks.forEach((week) => expect(week).toHaveLength(7));
  });
});
