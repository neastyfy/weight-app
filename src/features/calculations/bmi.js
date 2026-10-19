// ИМТ (индекс массы тела, BMI) = вес (кг) / рост (м)².
// Это ориентир, а не диагноз: он не учитывает состав тела.

import { isPositiveNumber } from './validators';

// Границы категорий ВОЗ для взрослых (от 18 лет).
// Категория подходит, если ИМТ меньше её верхней границы (upTo).
export const BMI_CATEGORIES = [
  { id: 'below', upTo: 18.5 }, // ниже нормы
  { id: 'normal', upTo: 25 }, // в пределах нормы
  { id: 'above', upTo: 30 }, // выше нормы
  { id: 'wellAbove', upTo: Infinity }, // значительно выше нормы
];

// Категории ВОЗ применимы только к взрослым
export const BMI_ADULT_AGE = 18;

// Возвращает ИМТ или null, если данных недостаточно
export function calculateBmi(weightKg, heightCm) {
  if (!isPositiveNumber(weightKg) || !isPositiveNumber(heightCm)) {
    return null;
  }
  const heightM = heightCm / 100;
  return weightKg / (heightM * heightM);
}

// Возвращает id категории или null (нет ИМТ или возраст младше 18 лет —
// для подростков нужны возрастные таблицы, а не взрослые границы)
export function getBmiCategory(bmi, ageYears) {
  if (!isPositiveNumber(bmi) || !isPositiveNumber(ageYears) || ageYears < BMI_ADULT_AGE) {
    return null;
  }
  return BMI_CATEGORIES.find((category) => bmi < category.upTo).id;
}
