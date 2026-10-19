import {
  PICKERS,
  buildProfileFromDraft,
  changeDraftHeightUnit,
  changeDraftWeightUnit,
  createEmptyDraft,
  validateAge,
  validateDraft,
  validateHeight,
  validateNickname,
  validateWeight,
} from '../profileModel';
import { toCm, toKg } from '@/lib/units';

const validDraft = {
  ...createEmptyDraft(),
  nickname: '  Алекс ',
  height: 175,
  weight: 72.4,
  age: 28,
  activityAnswers: ['walksRegularly'],
};

describe('проверка полей', () => {
  it('имя обязательно и ограничено по длине', () => {
    expect(validateNickname('   ')).toEqual({ key: 'errors.required' });
    expect(validateNickname('А'.repeat(31))?.key).toBe('errors.tooLong');
    expect(validateNickname('Алекс')).toBeNull();
  });

  it('рост, вес и возраст обязательны: шкала без выбора не считается ответом', () => {
    expect(validateHeight(null, 'cm')?.key).toBe('errors.pickValue');
    expect(validateWeight(null, 'kg')?.key).toBe('errors.pickValue');
    expect(validateAge(null)?.key).toBe('errors.pickValue');
  });

  it('проверяет диапазоны в выбранных единицах', () => {
    expect(validateHeight(175, 'cm')).toBeNull();
    expect(validateHeight(99, 'cm')?.key).toBe('errors.outOfRange');
    expect(validateHeight(69, 'in')).toBeNull();
    expect(validateWeight(160, 'lb')).toBeNull();
    expect(validateWeight(29.9, 'kg')?.key).toBe('errors.outOfRange');
    expect(validateWeight(Number.NaN, 'kg')?.key).toBe('errors.notNumber');
    expect(validateAge(13)?.key).toBe('errors.outOfRange');
    expect(validateAge(28.5)?.key).toBe('errors.notInteger');
  });

  it('границы шкал допустимы и соответствуют внутренним пределам', () => {
    for (const unit of ['kg', 'lb']) {
      const { min, max } = PICKERS.weight[unit];
      expect(validateWeight(min, unit)).toBeNull();
      expect(validateWeight(max, unit)).toBeNull();
      expect(toKg(min, unit)).toBeGreaterThanOrEqual(30);
      expect(toKg(max, unit)).toBeLessThanOrEqual(300);
    }
    for (const unit of ['cm', 'in']) {
      const { min, max } = PICKERS.height[unit];
      expect(toCm(min, unit)).toBeGreaterThanOrEqual(100);
      expect(toCm(max, unit)).toBeLessThanOrEqual(250);
    }
  });

  it('целевой вес необязателен', () => {
    expect(validateWeight(null, 'kg', { required: false })).toBeNull();
    expect(validateWeight(500, 'kg', { required: false })?.key).toBe('errors.outOfRange');
  });

  it('validateDraft возвращает только ошибочные поля', () => {
    expect(validateDraft(validDraft)).toEqual({});
    expect(Object.keys(validateDraft(createEmptyDraft())).sort()).toEqual(['age', 'height', 'nickname', 'weight']);
  });
});

describe('buildProfileFromDraft', () => {
  const now = new Date('2026-10-18T10:00:00.000Z');

  it('хранит всё во внутренних единицах', () => {
    const { profile, initialWeightKg } = buildProfileFromDraft(
      { ...validDraft, weightUnit: 'lb', heightUnit: 'in', height: 70, weight: 160, targetWeight: 150 },
      now,
    );
    expect(profile.heightCm).toBeCloseTo(177.8, 6);
    expect(initialWeightKg).toBeCloseTo(72.5747792, 6);
    expect(profile.targetWeightKg).toBeCloseTo(68.0388555, 6);
    expect(profile.weightUnit).toBe('lb');
    expect(profile.heightUnit).toBe('in');
  });

  it('обрезает имя, сохраняет даты и не выдумывает необязательные поля', () => {
    const { profile } = buildProfileFromDraft(validDraft, now);
    expect(profile.nickname).toBe('Алекс');
    expect(profile.sex).toBeNull();
    expect(profile.targetWeightKg).toBeNull();
    expect(profile.photoUri).toBeNull();
    expect(profile.ageYears).toBe(28);
    expect(profile.ageRecordedAt).toBe(now.toISOString());
    expect(profile.createdAt).toBe(now.toISOString());
  });
});

describe('смена единиц в черновике', () => {
  it('пересчитывает выбранные значения с шагом шкалы', () => {
    const draft = changeDraftWeightUnit({ ...validDraft, targetWeight: 68 }, 'lb');
    expect(draft.weight).toBe(159.6); // шаг 0,2 фунта
    expect(draft.targetWeight).toBe(150);
    expect(changeDraftHeightUnit(validDraft, 'in').height).toBe(69); // шаг 0,5 дюйма
    expect(changeDraftWeightUnit(draft, 'kg').weight).toBe(72.4);
  });

  it('не трогает невыбранные значения', () => {
    const draft = changeDraftWeightUnit(createEmptyDraft(), 'lb');
    expect(draft.weight).toBeNull();
    expect(draft.targetWeight).toBeNull();
    expect(changeDraftHeightUnit(createEmptyDraft(), 'in').height).toBeNull();
  });
});
