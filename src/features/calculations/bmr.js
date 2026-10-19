// BMR — оценка базового обмена веществ (ккал в сутки в состоянии покоя).
// Это ПРИБЛИЖЁННАЯ расчётная оценка, а не измерение и не медицинский показатель.
// Приложение не использует её для целей, прогнозов или подсчёта калорий.
//
// Формула Миффлина — Сан Жеора (Mifflin–St Jeor, 1990):
//   BMR = 10 × вес(кг) + 6,25 × рост(см) − 5 × возраст(лет) + s
//   s = +5 для мужчин, −161 для женщин
// Формула выведена для взрослых, поэтому для младше 18 лет оценка не считается.
// Без указания пола оценка не считается — подставлять среднее значение мы не будем.

import { isPositiveNumber } from './validators';

export const BMR_FORMULA = {
  id: 'mifflin-st-jeor', // сохраним в истории, если формула когда-нибудь поменяется
  weightFactor: 10,
  heightFactor: 6.25,
  ageFactor: 5,
  sexConstant: { male: 5, female: -161 },
  minAge: 18,
};

// Возвращает BMR (ккал/сутки) или null, если данных недостаточно
export function calculateBmr({ weightKg, heightCm, ageYears, sex }) {
  const sexConstant = BMR_FORMULA.sexConstant[sex];
  if (
    sexConstant === undefined ||
    !isPositiveNumber(weightKg) ||
    !isPositiveNumber(heightCm) ||
    !isPositiveNumber(ageYears) ||
    ageYears < BMR_FORMULA.minAge
  ) {
    return null;
  }
  return (
    BMR_FORMULA.weightFactor * weightKg +
    BMR_FORMULA.heightFactor * heightCm -
    BMR_FORMULA.ageFactor * ageYears +
    sexConstant
  );
}

// Почему BMR не посчитан — чтобы честно объяснить это в интерфейсе.
// Возвращает null, если расчёт возможен.
export function getBmrUnavailableReason({ weightKg, heightCm, ageYears, sex }) {
  if (BMR_FORMULA.sexConstant[sex] === undefined) return 'noSex';
  if (isPositiveNumber(ageYears) && ageYears < BMR_FORMULA.minAge) return 'tooYoung';
  if (!isPositiveNumber(weightKg) || !isPositiveNumber(heightCm) || !isPositiveNumber(ageYears)) return 'noData';
  return null;
}
