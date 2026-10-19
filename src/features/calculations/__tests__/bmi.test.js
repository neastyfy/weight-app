import { calculateBmi, getBmiCategory } from '../bmi';

describe('calculateBmi', () => {
  it('считает ИМТ по весу и росту', () => {
    // 72,4 кг / (1,75 м)² = 23,64
    expect(calculateBmi(72.4, 175)).toBeCloseTo(23.64, 2);
  });

  it('возвращает null без данных или при некорректных значениях', () => {
    expect(calculateBmi(null, 175)).toBeNull();
    expect(calculateBmi(70, undefined)).toBeNull();
    expect(calculateBmi(0, 175)).toBeNull();
    expect(calculateBmi(70, -170)).toBeNull();
    expect(calculateBmi(Number.NaN, 170)).toBeNull();
    expect(calculateBmi('70', 170)).toBeNull();
  });
});

describe('getBmiCategory', () => {
  it('определяет категорию ВОЗ на границах', () => {
    expect(getBmiCategory(18.49, 30)).toBe('below');
    expect(getBmiCategory(18.5, 30)).toBe('normal');
    expect(getBmiCategory(24.99, 30)).toBe('normal');
    expect(getBmiCategory(25, 30)).toBe('above');
    expect(getBmiCategory(29.99, 30)).toBe('above');
    expect(getBmiCategory(30, 30)).toBe('wellAbove');
  });

  it('не даёт взрослую категорию до 18 лет', () => {
    expect(getBmiCategory(23, 17)).toBeNull();
    expect(getBmiCategory(23, 18)).toBe('normal');
  });

  it('возвращает null без ИМТ или возраста', () => {
    expect(getBmiCategory(null, 30)).toBeNull();
    expect(getBmiCategory(23, null)).toBeNull();
  });
});
