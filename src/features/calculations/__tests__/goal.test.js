import { assessGoal } from '../goal';

// Рост 175 см: ИМТ = вес / 3,0625
const base = { heightCm: 175, ageYears: 30 };
const kgForBmi = (bmi) => bmi * 1.75 * 1.75;
const assess = (targetBmi, currentBmi = 26) =>
  assessGoal({ ...base, targetWeightKg: kgForBmi(targetBmi), currentWeightKg: kgForBmi(currentBmi) });

describe('assessGoal', () => {
  it('возвращает null без нужных данных', () => {
    expect(assessGoal({ ...base, targetWeightKg: null, currentWeightKg: 70 })).toBeNull();
    expect(assessGoal({ targetWeightKg: 65, currentWeightKg: 70, heightCm: 0, ageYears: 30 })).toBeNull();
  });

  it('слишком низкая цель — три уровня', () => {
    expect(assess(15.5).id).toBe('lowSevere');
    expect(assess(17).id).toBe('lowModerate');
    expect(assess(18.2).id).toBe('lowMild');
    expect(assess(15.5).tone).toBe('error');
  });

  it('слишком высокая цель — три варианта', () => {
    expect(assess(28, 32).id).toBe('highMild');
    expect(assess(31, 36).id).toBe('highFar');
    expect(assess(27, 24).id).toBe('highGain'); // набор веса выше нормы
  });

  it('цель в пределах нормы — три варианта', () => {
    expect(assess(22, 23).id).toBe('excellent');
    expect(assess(19, 19.5).id).toBe('normal');
    expect(assess(24.5, 32).id).toBe('longWay'); // изменение больше 20 %
  });

  it('границы зон', () => {
    expect(assess(16).id).toBe('lowModerate');
    expect(assess(18.5, 19).id).toBe('normal');
    expect(assess(20, 21).id).toBe('excellent');
    expect(assess(25, 27).id).toBe('highMild');
    expect(assess(30, 33).id).toBe('highFar');
  });

  it('до 18 лет — нейтральное пояснение вместо взрослых норм', () => {
    const result = assessGoal({ heightCm: 165, ageYears: 16, targetWeightKg: 45, currentWeightKg: 50 });
    expect(result.id).toBe('teen');
  });

  it('возвращает ИМТ при целевом весе', () => {
    expect(assess(22).targetBmi).toBeCloseTo(22, 6);
  });
});
