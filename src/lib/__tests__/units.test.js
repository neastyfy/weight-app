import { fromCm, fromKg, parseDecimal, parseInteger, toCm, toKg } from '../units';

describe('перевод единиц', () => {
  it('фунты ↔ килограммы', () => {
    expect(toKg(1, 'lb')).toBeCloseTo(0.45359237, 8);
    expect(toKg(70, 'kg')).toBe(70);
    expect(fromKg(toKg(165.3, 'lb'), 'lb')).toBeCloseTo(165.3, 10);
  });

  it('дюймы ↔ сантиметры', () => {
    expect(toCm(10, 'in')).toBeCloseTo(25.4, 10);
    expect(toCm(175, 'cm')).toBe(175);
    expect(fromCm(toCm(68.5, 'in'), 'in')).toBeCloseTo(68.5, 10);
  });
});

describe('parseDecimal', () => {
  it('принимает запятую и точку', () => {
    expect(parseDecimal('72,4')).toBe(72.4);
    expect(parseDecimal('72.4')).toBe(72.4);
    expect(parseDecimal(' 80 ')).toBe(80);
  });

  it('отклоняет пустое и некорректное', () => {
    expect(parseDecimal('')).toBeNull();
    expect(parseDecimal('abc')).toBeNull();
    expect(parseDecimal('7,2,1')).toBeNull();
    expect(parseDecimal('-5')).toBeNull();
    expect(parseDecimal(',5')).toBeNull();
    expect(parseDecimal(null)).toBeNull();
  });
});

describe('parseInteger', () => {
  it('принимает только целые числа', () => {
    expect(parseInteger('28')).toBe(28);
    expect(parseInteger('28,5')).toBeNull();
    expect(parseInteger('')).toBeNull();
  });
});
