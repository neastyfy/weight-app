import { calculateBmr, getBmrUnavailableReason } from '../bmr';

describe('calculateBmr (Миффлин — Сан Жеор)', () => {
  it('считает для мужчины', () => {
    // 10×80 + 6,25×180 − 5×30 + 5 = 1780
    expect(calculateBmr({ weightKg: 80, heightCm: 180, ageYears: 30, sex: 'male' })).toBeCloseTo(1780, 5);
  });

  it('считает для женщины', () => {
    // 10×60 + 6,25×165 − 5×28 − 161 = 1330,25
    expect(calculateBmr({ weightKg: 60, heightCm: 165, ageYears: 28, sex: 'female' })).toBeCloseTo(1330.25, 5);
  });

  it('не считает без пола — без подстановки среднего', () => {
    expect(calculateBmr({ weightKg: 60, heightCm: 165, ageYears: 28, sex: null })).toBeNull();
    expect(calculateBmr({ weightKg: 60, heightCm: 165, ageYears: 28, sex: 'other' })).toBeNull();
  });

  it('не считает до 18 лет и при некорректных данных', () => {
    expect(calculateBmr({ weightKg: 60, heightCm: 165, ageYears: 17, sex: 'female' })).toBeNull();
    expect(calculateBmr({ weightKg: 60, heightCm: 165, ageYears: 18, sex: 'female' })).not.toBeNull();
    expect(calculateBmr({ weightKg: null, heightCm: 165, ageYears: 30, sex: 'female' })).toBeNull();
    expect(calculateBmr({ weightKg: 60, heightCm: 0, ageYears: 30, sex: 'female' })).toBeNull();
  });
});

describe('getBmrUnavailableReason', () => {
  it('объясняет, почему оценки нет', () => {
    expect(getBmrUnavailableReason({ weightKg: 60, heightCm: 165, ageYears: 30, sex: null })).toBe('noSex');
    expect(getBmrUnavailableReason({ weightKg: 60, heightCm: 165, ageYears: 16, sex: 'male' })).toBe('tooYoung');
    expect(getBmrUnavailableReason({ weightKg: null, heightCm: 165, ageYears: 30, sex: 'male' })).toBe('noData');
    expect(getBmrUnavailableReason({ weightKg: 60, heightCm: 165, ageYears: 30, sex: 'male' })).toBeNull();
  });
});
