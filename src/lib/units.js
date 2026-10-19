// Единицы измерения и перевод между ними.
//
// ВНУТРИ приложения (в базе и в расчётах) всегда используются:
//   вес — килограммы, рост — сантиметры.
// Фунты и дюймы существуют только при вводе и показе значений.

export const KG_PER_LB = 0.45359237; // точное определение фунта
export const CM_PER_INCH = 2.54; // точное определение дюйма

export const WEIGHT_UNITS = ['kg', 'lb'];
export const HEIGHT_UNITS = ['cm', 'in'];

// Вес: из выбранной единицы в килограммы и обратно
export function toKg(value, unit) {
  return unit === 'lb' ? value * KG_PER_LB : value;
}

export function fromKg(kg, unit) {
  return unit === 'lb' ? kg / KG_PER_LB : kg;
}

// Рост: из выбранной единицы в сантиметры и обратно
export function toCm(value, unit) {
  return unit === 'in' ? value * CM_PER_INCH : value;
}

export function fromCm(cm, unit) {
  return unit === 'in' ? cm / CM_PER_INCH : cm;
}

// Округление до заданного числа знаков после запятой
export function roundTo(value, digits = 0) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

// Разбирает число из текста поля ввода.
// Принимает и запятую, и точку: «72,4» и «72.4». Пустая строка или мусор → null.
export function parseDecimal(text) {
  if (typeof text !== 'string') return null;
  const normalized = text.trim().replace(',', '.');
  if (!/^\d+(\.\d+)?$/.test(normalized)) return null;
  return Number(normalized);
}

// Разбирает целое число (например, возраст). «28» → 28, «28,5» → null.
export function parseInteger(text) {
  if (typeof text !== 'string') return null;
  const normalized = text.trim();
  if (!/^\d+$/.test(normalized)) return null;
  return Number(normalized);
}
