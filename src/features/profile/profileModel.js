// Модель профиля: допустимые значения, проверка ввода и подготовка данных к сохранению.
// Только чистые функции — их легко тестировать (см. __tests__/profileModel.test.js).
//
// Профиль в приложении (после загрузки из базы) выглядит так:
// {
//   nickname: 'Алекс',
//   mascotId: 'peach',
//   photoUri: 'data:image/jpeg;base64,…' | null, // фото профиля (выбирается после онбординга)
//   heightCm: 175,                 // всегда сантиметры
//   ageYears: 28,                  // возраст на дату ageRecordedAt
//   ageRecordedAt: '2026-10-18T…', // когда указан возраст
//   sex: 'female' | 'male' | null, // необязательно, нужен только для BMR
//   weightUnit: 'kg' | 'lb',       // в чём показывать вес
//   heightUnit: 'cm' | 'in',       // в чём показывать рост
//   activityAnswers: ['walksRegularly', …],
//   targetWeightKg: 68 | null,     // всегда килограммы
//   goalType: 'lose' | 'gain' | 'maintain' | 'none', // тип цели (определяется по цели и весу)
//   createdAt, updatedAt,
// }
// Вес не хранится в профиле: это измерения (таблица weight_entries).

import { determineGoalType } from '@/features/goals/goalModel';
import { DEFAULT_MASCOT_ID } from '@/features/mascots/mascotRegistry';
import { fromCm, fromKg, roundTo, toCm, toKg } from '@/lib/units';

// Допустимые диапазоны во внутренних единицах
export const LIMITS = {
  nicknameMaxLength: 30,
  heightCm: { min: 100, max: 250 },
  weightKg: { min: 30, max: 300 },
  ageYears: { min: 14, max: 100 },
};

export const SEX_OPTIONS = ['female', 'male'];

// Настройки шкал для выбора значений в каждой единице измерения.
// initial — только начальное ПОЛОЖЕНИЕ шкалы; значение не считается выбранным,
// пока пользователь не сдвинет шкалу или не введёт число.
export const PICKERS = {
  height: {
    cm: { min: 100, max: 250, step: 1, initial: 170, majorEvery: 10, labelEvery: 10 },
    in: { min: 40, max: 98, step: 0.5, initial: 67, majorEvery: 4, labelEvery: 4 },
  },
  weight: {
    kg: { min: 30, max: 300, step: 0.1, initial: 70, majorEvery: 10, labelEvery: 10 },
    lb: { min: 67, max: 661, step: 0.2, initial: 155, majorEvery: 5, labelEvery: 10 },
  },
  age: { min: LIMITS.ageYears.min, max: LIMITS.ageYears.max, step: 1, initial: 30 },
};

// Пустой черновик онбординга. Числа — в выбранных единицах; null — ещё не выбрано.
export function createEmptyDraft() {
  return {
    nickname: '',
    mascotId: DEFAULT_MASCOT_ID,
    weightUnit: 'kg',
    heightUnit: 'cm',
    height: null,
    weight: null,
    age: null,
    sex: null,
    activityAnswers: [],
    targetWeight: null,
  };
}

// Каждая проверка возвращает null (всё хорошо) или ошибку { key, params } для перевода.

export function validateNickname(nickname) {
  const value = nickname.trim();
  if (value.length === 0) return { key: 'errors.required' };
  if (value.length > LIMITS.nicknameMaxLength) {
    return { key: 'errors.tooLong', params: { max: LIMITS.nicknameMaxLength } };
  }
  return null;
}

function validateRange(value, picker, { required = true } = {}) {
  if (value == null) return required ? { key: 'errors.pickValue' } : null;
  if (typeof value !== 'number' || !Number.isFinite(value)) return { key: 'errors.notNumber' };
  // Небольшой допуск на погрешность перевода единиц
  if (value < picker.min - 1e-6 || value > picker.max + 1e-6) {
    return { key: 'errors.outOfRange', params: { min: picker.min, max: picker.max } };
  }
  return null;
}

export function validateHeight(value, unit) {
  return validateRange(value, PICKERS.height[unit]);
}

export function validateWeight(value, unit, options) {
  return validateRange(value, PICKERS.weight[unit], options);
}

export function validateAge(value) {
  if (value != null && !Number.isInteger(value)) return { key: 'errors.notInteger' };
  return validateRange(value, PICKERS.age);
}

// Проверка всего черновика: { поле: ошибка }. Пустой объект — ошибок нет.
export function validateDraft(draft) {
  const errors = {
    nickname: validateNickname(draft.nickname),
    height: validateHeight(draft.height, draft.heightUnit),
    weight: validateWeight(draft.weight, draft.weightUnit),
    age: validateAge(draft.age),
    targetWeight: validateWeight(draft.targetWeight, draft.weightUnit, { required: false }),
  };
  return Object.fromEntries(Object.entries(errors).filter(([, error]) => error));
}

// Готовит данные к сохранению: переводит всё во внутренние единицы.
// Возвращает { profile, initialWeightKg }. Перед вызовом черновик должен пройти validateDraft.
export function buildProfileFromDraft(draft, now = new Date()) {
  const nowIso = now.toISOString();
  const initialWeightKg = toKg(draft.weight, draft.weightUnit);
  const targetWeightKg = draft.targetWeight == null ? null : toKg(draft.targetWeight, draft.weightUnit);

  return {
    profile: {
      nickname: draft.nickname.trim(),
      mascotId: draft.mascotId,
      photoUri: null,
      heightCm: toCm(draft.height, draft.heightUnit),
      ageYears: draft.age,
      ageRecordedAt: nowIso,
      sex: SEX_OPTIONS.includes(draft.sex) ? draft.sex : null,
      weightUnit: draft.weightUnit,
      heightUnit: draft.heightUnit,
      activityAnswers: [...draft.activityAnswers],
      targetWeightKg,
      goalType: determineGoalType(targetWeightKg, initialWeightKg),
      createdAt: nowIso,
      updatedAt: nowIso,
    },
    initialWeightKg,
  };
}

// Округление до шага шкалы (0,1 кг, 0,2 фунта, 0,5 дюйма…) в её пределах
function snapToPicker(value, picker) {
  const snapped = picker.min + Math.round((value - picker.min) / picker.step) * picker.step;
  const digits = picker.step < 1 ? 1 : 0;
  return roundTo(Math.min(picker.max, Math.max(picker.min, snapped)), digits);
}

// При смене единиц в онбординге уже выбранные значения пересчитываются, а не теряются
export function changeDraftWeightUnit(draft, unit) {
  if (unit === draft.weightUnit) return draft;
  const convert = (v) => (v == null ? null : snapToPicker(fromKg(toKg(v, draft.weightUnit), unit), PICKERS.weight[unit]));
  return { ...draft, weightUnit: unit, weight: convert(draft.weight), targetWeight: convert(draft.targetWeight) };
}

export function changeDraftHeightUnit(draft, unit) {
  if (unit === draft.heightUnit) return draft;
  const height = draft.height == null ? null : snapToPicker(fromCm(toCm(draft.height, draft.heightUnit), unit), PICKERS.height[unit]);
  return { ...draft, heightUnit: unit, height };
}
