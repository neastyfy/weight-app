import { getCurrentAge } from '../age';

describe('getCurrentAge', () => {
  const recordedAt = '2026-10-18T10:00:00.000Z';

  it('в день ввода возвращает указанный возраст', () => {
    expect(getCurrentAge(28, recordedAt, new Date('2026-10-18T12:00:00Z'))).toBe(28);
  });

  it('прибавляет только полные прошедшие годы', () => {
    expect(getCurrentAge(28, recordedAt, new Date('2027-10-17T10:00:00Z'))).toBe(28);
    expect(getCurrentAge(28, recordedAt, new Date('2027-10-19T10:00:00Z'))).toBe(29);
    expect(getCurrentAge(28, recordedAt, new Date('2031-01-01T00:00:00Z'))).toBe(32);
  });

  it('не уменьшает возраст, если часы устройства ушли назад', () => {
    expect(getCurrentAge(28, recordedAt, new Date('2025-01-01T00:00:00Z'))).toBe(28);
  });

  it('обрабатывает отсутствующие данные', () => {
    expect(getCurrentAge(null, recordedAt)).toBeNull();
    expect(getCurrentAge(28, 'not a date')).toBe(28);
  });
});
