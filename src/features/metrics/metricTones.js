// Какой цвет («тон») у каждой категории показателей — чтобы было видно, что хорошо,
// а где есть куда расти. Тон — ключ цветов темы: success, caution, warning, error.
// Текстовые цвета: <тон>Text (например, successText) — темнее, для подписей.

// Категория активности
export const ACTIVITY_TONES = {
  sedentary: 'warning',
  light: 'caution',
  moderate: 'success',
  active: 'success',
};

// Категория ИМТ (границы ВОЗ — в src/features/calculations/bmi.js)
export const BMI_TONES = {
  below: 'warning',
  normal: 'success',
  above: 'warning',
  wellAbove: 'error',
};

// Зоны шкалы ИМТ: от 15 до 40 (за краями отметка просто стоит у края)
export const BMI_SCALE = {
  min: 15,
  max: 40,
  segments: [
    { from: 15, to: 18.5, tone: BMI_TONES.below },
    { from: 18.5, to: 25, tone: BMI_TONES.normal },
    { from: 25, to: 30, tone: BMI_TONES.above },
    { from: 30, to: 40, tone: BMI_TONES.wellAbove },
  ],
};

// Положение ИМТ на шкале: от 0 до 1
export function getBmiScalePosition(bmi) {
  return (bmi - BMI_SCALE.min) / (BMI_SCALE.max - BMI_SCALE.min);
}
