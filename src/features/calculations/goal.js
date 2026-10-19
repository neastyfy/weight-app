// Оценка целевого веса: насколько цель реалистична и безопасна.
// Опирается на ИМТ при целевом весе (границы ВОЗ для взрослых) и на величину изменения.
// Это подсказка, а не медицинская рекомендация.
//
// Варианты (id → тон):
//   Слишком низкая цель (ИМТ цели ниже 18,5):
//     lowSevere   — ИМТ < 16           → error
//     lowModerate — 16 ≤ ИМТ < 17,5    → warning
//     lowMild     — 17,5 ≤ ИМТ < 18,5  → caution
//   Слишком высокая цель (ИМТ цели 25 и выше):
//     highGain    — цель выше текущего веса → warning
//     highFar     — ИМТ ≥ 30           → warning
//     highMild    — 25 ≤ ИМТ < 30      → caution (хороший промежуточный этап)
//   Цель в пределах нормы (18,5 ≤ ИМТ < 25):
//     longWay     — изменение больше 20 % текущего веса → caution (разбить на этапы)
//     excellent   — 20 ≤ ИМТ ≤ 24      → success
//     normal      — остальные значения нормы → success
//   teen — младше 18 лет: взрослые нормы не подходят, только нейтральное пояснение.

import { BMI_ADULT_AGE, calculateBmi } from './bmi';
import { isPositiveNumber } from './validators';

export const GOAL_THRESHOLDS = {
  lowSevere: 16,
  lowModerate: 17.5,
  normalMin: 18.5,
  excellentMin: 20,
  excellentMax: 24,
  normalMax: 25,
  highFar: 30,
  longWayShare: 0.2, // доля текущего веса
  gainTolerance: 0.5, // кг: «цель выше текущего веса», если больше чем на 0,5 кг
};

export const GOAL_TONES = {
  lowSevere: 'error',
  lowModerate: 'warning',
  lowMild: 'caution',
  highGain: 'warning',
  highFar: 'warning',
  highMild: 'caution',
  longWay: 'caution',
  excellent: 'success',
  normal: 'success',
  teen: 'primary',
};

// Возвращает { id, tone, targetBmi } или null, если данных недостаточно
export function assessGoal({ targetWeightKg, currentWeightKg, heightCm, ageYears }) {
  if (!isPositiveNumber(targetWeightKg) || !isPositiveNumber(currentWeightKg) || !isPositiveNumber(heightCm)) {
    return null;
  }
  const targetBmi = calculateBmi(targetWeightKg, heightCm);
  const result = (id) => ({ id, tone: GOAL_TONES[id], targetBmi });
  const t = GOAL_THRESHOLDS;

  if (isPositiveNumber(ageYears) && ageYears < BMI_ADULT_AGE) return result('teen');

  if (targetBmi < t.lowSevere) return result('lowSevere');
  if (targetBmi < t.lowModerate) return result('lowModerate');
  if (targetBmi < t.normalMin) return result('lowMild');

  if (targetBmi >= t.normalMax) {
    if (targetWeightKg > currentWeightKg + t.gainTolerance) return result('highGain');
    if (targetBmi >= t.highFar) return result('highFar');
    return result('highMild');
  }

  if (Math.abs(currentWeightKg - targetWeightKg) / currentWeightKg > t.longWayShare) return result('longWay');
  if (targetBmi >= t.excellentMin && targetBmi <= t.excellentMax) return result('excellent');
  return result('normal');
}
