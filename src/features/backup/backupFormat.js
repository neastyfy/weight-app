// Формат резервной копии (JSON) — сборка и строгая проверка при восстановлении.
// Только чистые функции (тесты: __tests__/backupFormat.test.js).
//
// Файл:
//   {
//     format: 'weightapp-backup', version: 1, exportedAt: ISO, app: { name, version },
//     data: { profile, profileVersions, settings, weightEntries, bodyMeasurements, goals }
//   }
// Все значения — во внутренних единицах (кг, см), даты — ISO-строки в UTC.
//
// Безопасность импорта:
//   • файл только разбирается как JSON (JSON.parse) — никакой код из него не выполняется;
//   • из файла берутся только известные поля, всё остальное игнорируется;
//   • каждое значение проверяется по типу и диапазону теми же правилами, что и при вводе;
//   • любая ошибка в обязательных данных — весь файл отклоняется, база не меняется.

import { ACTIVITY_STATEMENTS } from '@/features/calculations';
import { GOAL_TYPES, determineGoalType } from '@/features/goals/goalModel';
import { MASCOT_IDS, DEFAULT_MASCOT_ID } from '@/features/mascots/mascotRegistry';
import {
  BODY_MEASUREMENT_TYPE_IDS,
  NOTE_MAX_LENGTH,
  validateCircumferenceCm,
  validateMeasuredAt,
  validateWeightKg,
} from '@/features/measurements/measurementModel';
import { LIMITS, SEX_OPTIONS, validateNickname } from '@/features/profile/profileModel';
import { translations } from '@/i18n/languages';
import { isValidDate } from '@/lib/dates';
import { HEIGHT_UNITS, WEIGHT_UNITS } from '@/lib/units';
import { THEME_MODES } from '@/theme/themeModes';

export const BACKUP_FORMAT = 'weightapp-backup';
export const BACKUP_VERSION = 1;
// Ограничения, чтобы огромный или испорченный файл не «повесил» приложение
export const BACKUP_LIMITS = {
  maxFileChars: 30 * 1024 * 1024, // ~30 МБ текста
  maxItems: 100000, // записей в каждом списке
  maxPhotoChars: 3 * 1024 * 1024, // фото профиля (data-URI)
};
// Какие настройки переносятся. Напоминания не переносятся: они зависят от устройства и разрешений.
export const BACKUP_SETTING_KEYS = ['language', 'theme', 'celebratedGoalId'];

const ACTIVITY_IDS = new Set(ACTIVITY_STATEMENTS.map((statement) => statement.id));

// Собрать резервную копию из данных приложения (см. backupRepository.readBackupData)
export function createBackup(data, { now = new Date(), appVersion = '1.0.0' } = {}) {
  const settings = Object.fromEntries(
    Object.entries(data.settings ?? {}).filter(([key, value]) => BACKUP_SETTING_KEYS.includes(key) && value != null),
  );
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    app: { name: 'WeightApp', version: appVersion },
    data: {
      profile: data.profile,
      profileVersions: data.profileVersions,
      settings,
      weightEntries: data.weightEntries,
      bodyMeasurements: data.bodyMeasurements,
      goals: data.goals,
    },
  };
}

// ——— Проверка ———

// Собирает проблемы с путём к полю: «weightEntries[3].weightKg»
class Problems {
  constructor() {
    this.errors = [];
    this.warnings = [];
  }
  error(path, code) {
    if (this.errors.length < 50) this.errors.push({ path, code });
  }
  warn(code, params) {
    this.warnings.push({ code, ...params });
  }
}

const isObject = (value) => value != null && typeof value === 'object' && !Array.isArray(value);
const isFiniteNumber = (value) => typeof value === 'number' && Number.isFinite(value);

// ISO-дата → нормализованная строка UTC или null
function readDate(value, path, problems, { required = true, notFuture = false, now } = {}) {
  if (value == null) {
    if (required) problems.error(path, 'required');
    return null;
  }
  if (typeof value !== 'string' || value.length > 40 || !isValidDate(value) || !/^\d{4}-\d{2}-\d{2}T/.test(value)) {
    problems.error(path, 'invalidDate');
    return null;
  }
  const iso = new Date(value).toISOString();
  if (notFuture && validateMeasuredAt(iso, now)) {
    problems.error(path, 'invalidDate');
    return null;
  }
  return iso;
}

function readNote(value, path, problems) {
  if (value == null || value === '') return null;
  if (typeof value !== 'string' || value.length > NOTE_MAX_LENGTH * 2) {
    problems.error(path, 'invalidNote');
    return null;
  }
  const trimmed = value.trim();
  if (trimmed.length > NOTE_MAX_LENGTH) {
    problems.error(path, 'invalidNote');
    return null;
  }
  return trimmed || null;
}

function readArray(value, path, problems, { required = false } = {}) {
  if (value == null) {
    if (required) problems.error(path, 'required');
    return null;
  }
  if (!Array.isArray(value)) {
    problems.error(path, 'notList');
    return null;
  }
  if (value.length > BACKUP_LIMITS.maxItems) {
    problems.error(path, 'tooMany');
    return null;
  }
  return value;
}

// id сохраняются, если все — уникальные положительные целые; иначе нумеруются заново
function normalizeIds(items, rawItems) {
  const ids = rawItems.map((item) => (isObject(item) ? item.id : undefined));
  const valid = ids.every((id) => Number.isInteger(id) && id > 0) && new Set(ids).size === ids.length;
  if (valid) return { items, renumbered: false };
  return { items: items.map((item, index) => ({ ...item, id: index + 1 })), renumbered: true };
}

function readProfile(raw, problems) {
  const path = 'profile';
  if (!isObject(raw)) {
    problems.error(path, 'required');
    return null;
  }
  const nicknameError = typeof raw.nickname === 'string' ? validateNickname(raw.nickname) : { key: 'required' };
  if (nicknameError) problems.error(`${path}.nickname`, 'invalidValue');

  let mascotId = raw.mascotId;
  if (!MASCOT_IDS.includes(mascotId)) {
    problems.warn('unknownMascot');
    mascotId = DEFAULT_MASCOT_ID;
  }

  if (!isFiniteNumber(raw.heightCm) || raw.heightCm < LIMITS.heightCm.min || raw.heightCm > LIMITS.heightCm.max) {
    problems.error(`${path}.heightCm`, 'outOfRange');
  }
  if (!Number.isInteger(raw.ageYears) || raw.ageYears < LIMITS.ageYears.min || raw.ageYears > LIMITS.ageYears.max) {
    problems.error(`${path}.ageYears`, 'outOfRange');
  }
  const createdAt = readDate(raw.createdAt, `${path}.createdAt`, problems);
  const ageRecordedAt = readDate(raw.ageRecordedAt ?? raw.createdAt, `${path}.ageRecordedAt`, problems);
  const updatedAt = readDate(raw.updatedAt ?? raw.createdAt, `${path}.updatedAt`, problems);

  if (raw.sex != null && !SEX_OPTIONS.includes(raw.sex)) problems.error(`${path}.sex`, 'invalidValue');
  if (!WEIGHT_UNITS.includes(raw.weightUnit)) problems.error(`${path}.weightUnit`, 'invalidValue');
  if (!HEIGHT_UNITS.includes(raw.heightUnit)) problems.error(`${path}.heightUnit`, 'invalidValue');

  const activityAnswers = readActivity(raw.activityAnswers, `${path}.activityAnswers`, problems);

  let targetWeightKg = raw.targetWeightKg ?? null;
  if (targetWeightKg != null && validateWeightKg(targetWeightKg)) {
    problems.error(`${path}.targetWeightKg`, 'outOfRange');
    targetWeightKg = null;
  }
  let goalType = raw.goalType ?? (targetWeightKg == null ? 'none' : null);
  if (!GOAL_TYPES.includes(goalType)) problems.error(`${path}.goalType`, 'invalidValue');
  if (targetWeightKg == null) goalType = 'none';

  let photoUri = raw.photoUri ?? null;
  if (
    photoUri != null &&
    (typeof photoUri !== 'string' || !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(photoUri) || photoUri.length > BACKUP_LIMITS.maxPhotoChars)
  ) {
    problems.warn('photoSkipped');
    photoUri = null;
  }

  return {
    nickname: typeof raw.nickname === 'string' ? raw.nickname.trim() : '',
    mascotId,
    photoUri,
    heightCm: raw.heightCm,
    ageYears: raw.ageYears,
    ageRecordedAt,
    sex: raw.sex ?? null,
    weightUnit: raw.weightUnit,
    heightUnit: raw.heightUnit,
    activityAnswers,
    targetWeightKg,
    goalType,
    createdAt,
    updatedAt,
  };
}

function readActivity(value, path, problems) {
  if (value == null) return [];
  if (!Array.isArray(value) || value.length > 200) {
    problems.error(path, 'notList');
    return [];
  }
  const known = [...new Set(value.filter((id) => typeof id === 'string' && ACTIVITY_IDS.has(id)))];
  if (known.length !== value.length) problems.warn('unknownActivity');
  return known;
}

function readProfileVersions(rawList, profile, problems) {
  const list = readArray(rawList, 'profileVersions', problems);
  if (!list || list.length === 0) {
    // В копии нет версий — первая версия собирается из профиля
    if (profile) problems.warn('versionsCreated');
    return profile
      ? [
          {
            id: 1,
            heightCm: profile.heightCm,
            ageYears: profile.ageYears,
            ageRecordedAt: profile.ageRecordedAt,
            sex: profile.sex,
            activityAnswers: profile.activityAnswers,
            effectiveFrom: profile.createdAt,
            createdAt: profile.createdAt,
          },
        ]
      : [];
  }
  const items = list.map((raw, index) => {
    const path = `profileVersions[${index}]`;
    if (!isObject(raw)) {
      problems.error(path, 'invalidValue');
      return null;
    }
    if (!isFiniteNumber(raw.heightCm) || raw.heightCm < LIMITS.heightCm.min || raw.heightCm > LIMITS.heightCm.max) {
      problems.error(`${path}.heightCm`, 'outOfRange');
    }
    if (!Number.isInteger(raw.ageYears) || raw.ageYears < LIMITS.ageYears.min || raw.ageYears > LIMITS.ageYears.max) {
      problems.error(`${path}.ageYears`, 'outOfRange');
    }
    if (raw.sex != null && !SEX_OPTIONS.includes(raw.sex)) problems.error(`${path}.sex`, 'invalidValue');
    const effectiveFrom = readDate(raw.effectiveFrom, `${path}.effectiveFrom`, problems);
    return {
      id: raw.id,
      heightCm: raw.heightCm,
      ageYears: raw.ageYears,
      ageRecordedAt: readDate(raw.ageRecordedAt ?? raw.effectiveFrom, `${path}.ageRecordedAt`, problems),
      sex: raw.sex ?? null,
      activityAnswers: readActivity(raw.activityAnswers, `${path}.activityAnswers`, problems),
      effectiveFrom,
      createdAt: readDate(raw.createdAt ?? raw.effectiveFrom, `${path}.createdAt`, problems),
    };
  });
  return normalizeIds(items, list).items;
}

function readWeightEntries(rawList, problems, now) {
  const list = readArray(rawList, 'weightEntries', problems) ?? [];
  const items = list.map((raw, index) => {
    const path = `weightEntries[${index}]`;
    if (!isObject(raw)) {
      problems.error(path, 'invalidValue');
      return null;
    }
    if (validateWeightKg(raw.weightKg)) problems.error(`${path}.weightKg`, 'outOfRange');
    const measuredAt = readDate(raw.measuredAt, `${path}.measuredAt`, problems, { notFuture: true, now });
    return {
      id: raw.id,
      weightKg: raw.weightKg,
      measuredAt,
      note: readNote(raw.note, `${path}.note`, problems),
      createdAt: readDate(raw.createdAt ?? raw.measuredAt, `${path}.createdAt`, problems),
      updatedAt: readDate(raw.updatedAt, `${path}.updatedAt`, problems, { required: false }),
    };
  });
  const { items: normalized, renumbered } = normalizeIds(items, list);
  if (renumbered && list.length) problems.warn('idsRenumbered');
  return normalized;
}

function readBodyMeasurements(rawList, problems, now) {
  const list = readArray(rawList, 'bodyMeasurements', problems) ?? [];
  const items = list.map((raw, index) => {
    const path = `bodyMeasurements[${index}]`;
    if (!isObject(raw)) {
      problems.error(path, 'invalidValue');
      return null;
    }
    if (!BODY_MEASUREMENT_TYPE_IDS.includes(raw.type)) problems.error(`${path}.type`, 'invalidValue');
    else if (validateCircumferenceCm(raw.type, raw.valueCm)) problems.error(`${path}.valueCm`, 'outOfRange');
    const measuredAt = readDate(raw.measuredAt, `${path}.measuredAt`, problems, { notFuture: true, now });
    return {
      id: raw.id,
      type: raw.type,
      valueCm: raw.valueCm,
      measuredAt,
      note: readNote(raw.note, `${path}.note`, problems),
      createdAt: readDate(raw.createdAt ?? raw.measuredAt, `${path}.createdAt`, problems),
      updatedAt: readDate(raw.updatedAt, `${path}.updatedAt`, problems, { required: false }),
    };
  });
  return normalizeIds(items, list).items;
}

function readGoals(rawList, profile, problems) {
  const list = readArray(rawList, 'goals', problems);
  if (!list || list.length === 0) {
    // В копии нет истории целей — первая строка из текущей цели профиля
    const items = profile
      ? [{ id: 1, goalType: profile.goalType, targetWeightKg: profile.targetWeightKg, startedAt: profile.createdAt, createdAt: profile.createdAt }]
      : [];
    return { items, renumbered: false };
  }
  const items = list.map((raw, index) => {
    const path = `goals[${index}]`;
    if (!isObject(raw)) {
      problems.error(path, 'invalidValue');
      return null;
    }
    if (!GOAL_TYPES.includes(raw.goalType)) problems.error(`${path}.goalType`, 'invalidValue');
    const targetWeightKg = raw.goalType === 'none' ? null : raw.targetWeightKg;
    if (raw.goalType !== 'none' && validateWeightKg(targetWeightKg)) problems.error(`${path}.targetWeightKg`, 'outOfRange');
    const startedAt = readDate(raw.startedAt, `${path}.startedAt`, problems);
    return {
      id: raw.id,
      goalType: raw.goalType,
      targetWeightKg,
      startedAt,
      createdAt: readDate(raw.createdAt ?? raw.startedAt, `${path}.createdAt`, problems),
    };
  });
  return normalizeIds(items, list);
}

function readSettings(raw, problems, goals, goalsRenumbered) {
  const settings = {};
  if (raw == null) return settings;
  if (!isObject(raw)) {
    problems.warn('settingsSkipped');
    return settings;
  }
  if (typeof raw.language === 'string' && translations[raw.language]) settings.language = raw.language;
  if (THEME_MODES.includes(raw.theme)) settings.theme = raw.theme;
  // отметка «с этой целью уже поздравили» — только если такая цель есть в копии
  const celebrated = raw.celebratedGoalId;
  if (!goalsRenumbered && typeof celebrated === 'string' && goals.some((goal) => String(goal.id) === celebrated)) {
    settings.celebratedGoalId = celebrated;
  }
  return settings;
}

// Разбор и проверка текста файла.
// Возвращает { ok: true, data, summary, warnings } или { ok: false, error, details }.
//   error: 'tooLarge' | 'invalidJson' | 'wrongFormat' | 'newerVersion' | 'unsupportedVersion' | 'invalidData'
//   details — до 50 проблем вида { path, code } (для 'invalidData')
// Ничего не записывает в базу — восстановление выполняется отдельно, после подтверждения.
export function parseBackup(text, { now = new Date() } = {}) {
  if (typeof text !== 'string' || text.length > BACKUP_LIMITS.maxFileChars) return { ok: false, error: 'tooLarge' };
  let json;
  try {
    json = JSON.parse(text.replace(/^﻿/, ''));
  } catch {
    return { ok: false, error: 'invalidJson' };
  }
  if (!isObject(json) || json.format !== BACKUP_FORMAT) return { ok: false, error: 'wrongFormat' };
  if (!Number.isInteger(json.version) || json.version < 1) return { ok: false, error: 'unsupportedVersion' };
  if (json.version > BACKUP_VERSION) return { ok: false, error: 'newerVersion' };
  if (!isObject(json.data)) return { ok: false, error: 'invalidData', details: [{ path: 'data', code: 'required' }] };

  const problems = new Problems();
  const source = json.data;
  const profile = readProfile(source.profile, problems);
  const profileVersions = readProfileVersions(source.profileVersions, profile, problems);
  const weightEntries = readWeightEntries(source.weightEntries, problems, now);
  const bodyMeasurements = readBodyMeasurements(source.bodyMeasurements, problems, now);
  const { items: goals, renumbered: goalsRenumbered } = readGoals(source.goals, profile, problems);
  const settings = readSettings(source.settings, problems, goals, goalsRenumbered);

  if (problems.errors.length) return { ok: false, error: 'invalidData', details: problems.errors };

  // Тип цели в профиле согласуем с последней целью истории
  const lastGoal = [...goals].sort((a, b) => (a.startedAt < b.startedAt ? -1 : a.startedAt > b.startedAt ? 1 : a.id - b.id)).pop();
  if (lastGoal) {
    profile.goalType = lastGoal.goalType;
    profile.targetWeightKg = lastGoal.targetWeightKg;
  } else if (profile.targetWeightKg != null && profile.goalType == null) {
    profile.goalType = determineGoalType(profile.targetWeightKg, weightEntries[0]?.weightKg ?? null);
  }

  const data = { profile, profileVersions, settings, weightEntries, bodyMeasurements, goals };
  return { ok: true, data, summary: summarizeBackup(json, data), warnings: problems.warnings };
}

// Что будет восстановлено — для экрана подтверждения
export function summarizeBackup(json, data) {
  const dates = [...data.weightEntries, ...data.bodyMeasurements].map((entry) => entry.measuredAt).sort();
  return {
    exportedAt: typeof json.exportedAt === 'string' && isValidDate(json.exportedAt) ? new Date(json.exportedAt).toISOString() : null,
    nickname: data.profile.nickname,
    weightCount: data.weightEntries.length,
    bodyCount: data.bodyMeasurements.length,
    goalCount: data.goals.length,
    firstDate: dates[0] ?? null,
    lastDate: dates[dates.length - 1] ?? null,
  };
}
