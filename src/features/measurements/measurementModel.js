// Правила измерений: виды окружностей, допустимые значения, проверка ввода и защита от дублей.
// Только чистые функции — без интерфейса и базы данных (тесты: __tests__/measurementModel.test.js).
//
// Внутренние единицы: вес — килограммы, окружности — сантиметры.
// Даты — строки ISO в UTC (см. src/lib/dates.js).
import { LIMITS } from '@/features/profile/profileModel';
import { isValidDate, toIsoString } from '@/lib/dates';

// Виды окружностей тела. Порядок = порядок в интерфейсе.
// Чтобы добавить новый вид: допишите его сюда и добавьте переводы body.types.<id> и body.hints.<id>.
export const BODY_MEASUREMENT_TYPES = [
  { id: 'waist', icon: 'ellipse-outline', minCm: 40, maxCm: 250, initialCm: 80 },
  { id: 'hips', icon: 'ellipse-outline', minCm: 50, maxCm: 250, initialCm: 100 },
  { id: 'chest', icon: 'shirt-outline', minCm: 50, maxCm: 250, initialCm: 95 },
  { id: 'neck', icon: 'person-outline', minCm: 20, maxCm: 80, initialCm: 37 },
  { id: 'arm', icon: 'hand-left-outline', minCm: 15, maxCm: 80, initialCm: 30 },
  { id: 'thigh', icon: 'walk-outline', minCm: 25, maxCm: 120, initialCm: 55 },
];

export const BODY_MEASUREMENT_TYPE_IDS = BODY_MEASUREMENT_TYPES.map((type) => type.id);

export function getBodyMeasurementType(id) {
  return BODY_MEASUREMENT_TYPES.find((type) => type.id === id) ?? null;
}

export const NOTE_MAX_LENGTH = 280;
export const EARLIEST_DATE = '1900-01-01T00:00:00.000Z';
const FUTURE_TOLERANCE_MS = 5 * 60 * 1000; // часы устройства могут немного спешить

// Дубликат: такое же значение у той же величины в пределах нескольких минут
export const DUPLICATE_RULE = {
  windowMs: 5 * 60 * 1000,
  weightToleranceKg: 0.05,
  circumferenceToleranceCm: 0.1,
};

// Ошибки — объекты { key, params } для перевода (как в profileModel.js)

function isFiniteNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

export function validateWeightKg(weightKg) {
  if (!isFiniteNumber(weightKg)) return { key: 'errors.notNumber' };
  if (weightKg < LIMITS.weightKg.min || weightKg > LIMITS.weightKg.max) return { key: 'errors.outOfRange' };
  return null;
}

export function validateCircumferenceCm(typeId, valueCm) {
  const type = getBodyMeasurementType(typeId);
  if (!type) return { key: 'errors.unknownType' };
  if (!isFiniteNumber(valueCm)) return { key: 'errors.notNumber' };
  if (valueCm < type.minCm || valueCm > type.maxCm) return { key: 'errors.outOfRange' };
  return null;
}

export function validateMeasuredAt(measuredAt, now = new Date()) {
  if (!measuredAt || !isValidDate(measuredAt)) return { key: 'errors.invalidDate' };
  const time = new Date(measuredAt).getTime();
  if (time > now.getTime() + FUTURE_TOLERANCE_MS) return { key: 'errors.futureDate' };
  if (time < new Date(EARLIEST_DATE).getTime()) return { key: 'errors.invalidDate' };
  return null;
}

export function validateNote(note) {
  if (note == null) return null;
  if (typeof note !== 'string') return { key: 'errors.invalidNote' };
  if (note.trim().length > NOTE_MAX_LENGTH) return { key: 'errors.tooLong', params: { max: NOTE_MAX_LENGTH } };
  return null;
}

// Пустой комментарий хранится как null
export function normalizeNote(note) {
  const trimmed = typeof note === 'string' ? note.trim() : '';
  return trimmed.length > 0 ? trimmed : null;
}

// Проверяет запись веса и возвращает { entry, errors }.
// entry — нормализованные данные для сохранения (или null, если есть ошибки).
export function prepareWeightEntry({ weightKg, measuredAt, note }, now = new Date()) {
  const errors = Object.fromEntries(
    Object.entries({
      weightKg: validateWeightKg(weightKg),
      measuredAt: validateMeasuredAt(measuredAt, now),
      note: validateNote(note),
    }).filter(([, error]) => error),
  );
  if (Object.keys(errors).length > 0) return { entry: null, errors };
  return { entry: { weightKg, measuredAt: toIsoString(measuredAt), note: normalizeNote(note) }, errors };
}

export function prepareBodyMeasurement({ type, valueCm, measuredAt, note }, now = new Date()) {
  const errors = Object.fromEntries(
    Object.entries({
      valueCm: validateCircumferenceCm(type, valueCm),
      measuredAt: validateMeasuredAt(measuredAt, now),
      note: validateNote(note),
    }).filter(([, error]) => error),
  );
  if (Object.keys(errors).length > 0) return { entry: null, errors };
  return { entry: { type, valueCm, measuredAt: toIsoString(measuredAt), note: normalizeNote(note) }, errors };
}

// Ищет «случайный дубль»: запись с тем же значением в пределах нескольких минут.
// excludeId — id редактируемой записи (сама себе не дубль).
export function findDuplicate(entries, { value, measuredAt, excludeId = null }, { valueKey, tolerance }) {
  const time = new Date(measuredAt).getTime();
  return (
    entries.find(
      (entry) =>
        entry.id !== excludeId &&
        Math.abs(entry[valueKey] - value) <= tolerance &&
        Math.abs(new Date(entry.measuredAt).getTime() - time) <= DUPLICATE_RULE.windowMs,
    ) ?? null
  );
}
