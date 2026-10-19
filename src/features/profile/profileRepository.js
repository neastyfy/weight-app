// Чтение и запись профиля в базе. Экраны работают с профилем через useProfile(),
// а не напрямую с этим файлом.
import { insertGoal } from '@/features/goals/goalsRepository';
import { addWeightEntry } from '@/features/measurements/weightRepository';

import { pickVersionedParams, versionedParamsChanged } from './profileVersions';

// Строка таблицы → объект профиля (см. описание в profileModel.js)
function mapRow(row) {
  return {
    nickname: row.nickname,
    mascotId: row.mascot_id,
    photoUri: row.photo_uri ?? null,
    heightCm: row.height_cm,
    ageYears: row.age_years,
    ageRecordedAt: row.age_recorded_at,
    sex: row.sex,
    weightUnit: row.weight_unit,
    heightUnit: row.height_unit,
    activityAnswers: JSON.parse(row.activity_answers),
    targetWeightKg: row.target_weight_kg,
    goalType: row.goal_type ?? (row.target_weight_kg == null ? 'none' : null),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapVersionRow(row) {
  return {
    id: row.id,
    heightCm: row.height_cm,
    ageYears: row.age_years,
    ageRecordedAt: row.age_recorded_at,
    sex: row.sex,
    activityAnswers: JSON.parse(row.activity_answers),
    effectiveFrom: row.effective_from,
    createdAt: row.created_at,
  };
}

// Все версии параметров профиля по порядку (см. profileVersions.js)
export async function listProfileVersions(db) {
  const rows = await db.getAllAsync('SELECT * FROM profile_versions ORDER BY effective_from ASC, id ASC');
  return rows.map(mapVersionRow);
}

// Новая версия параметров (вызывается внутри транзакции вместе с изменением профиля)
async function insertProfileVersion(db, params, effectiveFrom, createdAt) {
  await db.runAsync(
    'INSERT INTO profile_versions (height_cm, age_years, age_recorded_at, sex, activity_answers, effective_from, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [params.heightCm, params.ageYears, params.ageRecordedAt, params.sex, JSON.stringify(params.activityAnswers), effectiveFrom, createdAt],
  );
}

export async function loadProfile(db) {
  const row = await db.getFirstAsync('SELECT * FROM profile WHERE id = 1');
  return row ? mapRow(row) : null;
}

// Создаёт профиль и первую запись веса одной транзакцией:
// либо сохраняется всё, либо ничего.
export async function createProfile(db, profile, initialWeightKg) {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO profile (
        id, nickname, mascot_id, height_cm, age_years, age_recorded_at, sex,
        weight_unit, height_unit, activity_answers, target_weight_kg, goal_type, created_at, updated_at
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        profile.nickname,
        profile.mascotId,
        profile.heightCm,
        profile.ageYears,
        profile.ageRecordedAt,
        profile.sex,
        profile.weightUnit,
        profile.heightUnit,
        JSON.stringify(profile.activityAnswers),
        profile.targetWeightKg,
        profile.goalType === 'none' ? null : profile.goalType,
        profile.createdAt,
        profile.updatedAt,
      ],
    );
    await addWeightEntry(db, {
      weightKg: initialWeightKg,
      measuredAt: profile.createdAt,
      createdAt: profile.createdAt,
    });
    // Первая версия параметров профиля — действует с момента создания
    await insertProfileVersion(db, pickVersionedParams(profile), profile.createdAt, profile.createdAt);
    // Первая строка истории целей (в том числе «без цели»)
    await insertGoal(db, { goalType: profile.goalType ?? 'none', targetWeightKg: profile.targetWeightKg, startedAt: profile.createdAt });
  });
}

// Фото профиля: data-URI картинки или null (вернуть стандартное фото)
export async function updateProfilePhoto(db, photoUri, updatedAt) {
  await db.runAsync('UPDATE profile SET photo_uri = ?, updated_at = ? WHERE id = 1', [photoUri, updatedAt]);
}

// Изменение профиля после онбординга. changes — любые из полей:
//   nickname, mascotId, weightUnit, heightUnit (не влияют на расчёты),
//   heightCm, ageYears, sex, activityAnswers (влияют — сохраняется новая версия).
// При смене возраста дата его указания обновляется (возраст дальше растёт сам от неё).
// Профиль и версия меняются одной транзакцией. Значения должны быть уже проверены.
export async function updateProfile(db, changes, now = new Date()) {
  const nowIso = now.toISOString();
  await db.withTransactionAsync(async () => {
    const current = await loadProfile(db);
    if (!current) throw new Error('Профиль не найден');
    const next = { ...current, ...changes };
    if (changes.ageYears != null && changes.ageYears !== current.ageYears) next.ageRecordedAt = nowIso;

    await db.runAsync(
      `UPDATE profile SET nickname = ?, mascot_id = ?, weight_unit = ?, height_unit = ?,
        height_cm = ?, age_years = ?, age_recorded_at = ?, sex = ?, activity_answers = ?, updated_at = ? WHERE id = 1`,
      [
        next.nickname,
        next.mascotId,
        next.weightUnit,
        next.heightUnit,
        next.heightCm,
        next.ageYears,
        next.ageRecordedAt,
        next.sex ?? null,
        JSON.stringify(next.activityAnswers),
        nowIso,
      ],
    );
    if (versionedParamsChanged(current, next)) {
      await insertProfileVersion(db, pickVersionedParams(next), nowIso, nowIso);
    }
  });
}

// Удаляет ВСЕ пользовательские данные: профиль и его версии, измерения, цели и настройки
// (язык, тема, напоминания, служебные отметки). После этого приложение как при первом запуске.
export async function deleteAllUserData(db) {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM settings');
    await db.runAsync('DELETE FROM profile_versions');
    await db.runAsync('DELETE FROM goals');
    await db.runAsync('DELETE FROM body_measurements');
    await db.runAsync('DELETE FROM weight_entries');
    await db.runAsync('DELETE FROM profile');
  });
}
