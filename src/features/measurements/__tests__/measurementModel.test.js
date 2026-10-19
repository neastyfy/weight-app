import { fromCm, parseDecimal, toCm } from '@/lib/units';

import {
  BODY_MEASUREMENT_TYPES,
  findDuplicate,
  normalizeNote,
  prepareBodyMeasurement,
  prepareWeightEntry,
  validateCircumferenceCm,
  validateMeasuredAt,
  validateWeightKg,
} from '../measurementModel';

const NOW = new Date('2026-10-19T12:00:00.000Z');

describe('проверка измерений', () => {
  it('вес: только реальные числа в допустимом диапазоне', () => {
    expect(validateWeightKg(72.4)).toBeNull();
    expect(validateWeightKg(0)?.key).toBe('errors.outOfRange');
    expect(validateWeightKg(-1)?.key).toBe('errors.outOfRange');
    expect(validateWeightKg(301)?.key).toBe('errors.outOfRange');
    expect(validateWeightKg(Number.NaN)?.key).toBe('errors.notNumber');
    expect(validateWeightKg(null)?.key).toBe('errors.notNumber');
  });

  it('окружности: свой диапазон у каждого вида', () => {
    expect(validateCircumferenceCm('waist', 82)).toBeNull();
    expect(validateCircumferenceCm('neck', 120)?.key).toBe('errors.outOfRange');
    expect(validateCircumferenceCm('unknown', 50)?.key).toBe('errors.unknownType');
    for (const type of BODY_MEASUREMENT_TYPES) {
      expect(validateCircumferenceCm(type.id, type.initialCm)).toBeNull();
    }
  });

  it('дата: не в будущем (с небольшим допуском) и корректная', () => {
    expect(validateMeasuredAt('2026-10-19T12:04:00.000Z', NOW)).toBeNull(); // часы спешат на 4 минуты
    expect(validateMeasuredAt('2026-10-20T12:00:00.000Z', NOW)?.key).toBe('errors.futureDate');
    expect(validateMeasuredAt('2020-01-01T00:00:00.000Z', NOW)).toBeNull(); // задним числом можно
    expect(validateMeasuredAt('1800-01-01T00:00:00.000Z', NOW)?.key).toBe('errors.invalidDate');
    expect(validateMeasuredAt(null, NOW)?.key).toBe('errors.invalidDate');
  });

  it('комментарий: обрезается, пустой — null', () => {
    expect(normalizeNote('  утром  ')).toBe('утром');
    expect(normalizeNote('   ')).toBeNull();
    expect(normalizeNote(undefined)).toBeNull();
  });

  it('готовит запись в едином формате даты', () => {
    const { entry } = prepareWeightEntry({ weightKg: 70, measuredAt: new Date('2026-10-19T06:30:00Z') }, NOW);
    expect(entry.measuredAt).toBe('2026-10-19T06:30:00.000Z');
    const { entry: body, errors } = prepareBodyMeasurement({ type: 'waist', valueCm: 0, measuredAt: NOW }, NOW);
    expect(body).toBeNull();
    expect(errors.valueCm.key).toBe('errors.outOfRange');
  });

  it('ищет дубликаты только рядом по времени и значению', () => {
    const entries = [{ id: 1, weightKg: 72.4, measuredAt: '2026-10-19T06:00:00.000Z' }];
    const rule = { valueKey: 'weightKg', tolerance: 0.05 };
    expect(findDuplicate(entries, { value: 72.42, measuredAt: '2026-10-19T06:04:00.000Z' }, rule)?.id).toBe(1);
    expect(findDuplicate(entries, { value: 72.4, measuredAt: '2026-10-19T06:10:00.000Z' }, rule)).toBeNull();
    expect(findDuplicate(entries, { value: 72.6, measuredAt: '2026-10-19T06:00:00.000Z' }, rule)).toBeNull();
    expect(findDuplicate(entries, { value: 72.4, measuredAt: '2026-10-19T06:00:00.000Z', excludeId: 1 }, rule)).toBeNull();
  });

  it('окружности в дюймах: ввод с запятой и обратное преобразование без потерь', () => {
    const cm = toCm(parseDecimal('31,5'), 'in');
    expect(cm).toBeCloseTo(80.01, 6);
    expect(fromCm(cm, 'in')).toBeCloseTo(31.5, 10);
  });
});
