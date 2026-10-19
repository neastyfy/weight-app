// Чтение всех данных для резервной копии и восстановление из неё.
// Экраны работают с этим через useBackup(), а не напрямую.
import { listGoals } from '@/features/goals/goalsRepository';
import { listBodyMeasurements } from '@/features/measurements/bodyMeasurementRepository';
import { listWeightEntries } from '@/features/measurements/weightRepository';
import { listProfileVersions, loadProfile } from '@/features/profile/profileRepository';
import { SETTING_KEYS, getAllSettings } from '@/storage/settingsRepository';

import { BACKUP_SETTING_KEYS } from './backupFormat';

// Всё, что попадает в резервную копию (во внутренних единицах)
export async function readBackupData(db) {
  const [profile, profileVersions, settings, weightEntries, bodyMeasurements, goals] = await Promise.all([
    loadProfile(db),
    listProfileVersions(db),
    getAllSettings(db),
    listWeightEntries(db),
    listBodyMeasurements(db),
    listGoals(db),
  ]);
  return {
    profile,
    profileVersions,
    settings: Object.fromEntries(Object.entries(settings).filter(([key]) => BACKUP_SETTING_KEYS.includes(key))),
    weightEntries,
    bodyMeasurements,
    goals,
  };
}

// Настройки, которые остаются от устройства при восстановлении (напоминания зависят от разрешений)
const DEVICE_SETTING_KEYS = [SETTING_KEYS.reminderEnabled, SETTING_KEYS.reminderTime];

// Полная замена данных копией. data — ТОЛЬКО результат parseBackup (уже проверенный).
// Всё в одной транзакции: если что-то не записалось, база остаётся в прежнем состоянии.
export async function restoreBackupData(db, data) {
  await db.withTransactionAsync(async () => {
    const keep = DEVICE_SETTING_KEYS.map(() => '?').join(', ');
    await db.runAsync(`DELETE FROM settings WHERE key NOT IN (${keep})`, DEVICE_SETTING_KEYS);
    await db.runAsync('DELETE FROM profile_versions');
    await db.runAsync('DELETE FROM goals');
    await db.runAsync('DELETE FROM body_measurements');
    await db.runAsync('DELETE FROM weight_entries');
    await db.runAsync('DELETE FROM profile');

    const p = data.profile;
    await db.runAsync(
      `INSERT INTO profile (
        id, nickname, mascot_id, photo_uri, height_cm, age_years, age_recorded_at, sex,
        weight_unit, height_unit, activity_answers, target_weight_kg, goal_type, created_at, updated_at
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        p.nickname,
        p.mascotId,
        p.photoUri,
        p.heightCm,
        p.ageYears,
        p.ageRecordedAt,
        p.sex,
        p.weightUnit,
        p.heightUnit,
        JSON.stringify(p.activityAnswers),
        p.targetWeightKg,
        p.goalType === 'none' ? null : p.goalType,
        p.createdAt,
        p.updatedAt,
      ],
    );

    for (const v of data.profileVersions) {
      await db.runAsync(
        `INSERT INTO profile_versions (id, height_cm, age_years, age_recorded_at, sex, activity_answers, effective_from, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [v.id, v.heightCm, v.ageYears, v.ageRecordedAt, v.sex, JSON.stringify(v.activityAnswers), v.effectiveFrom, v.createdAt],
      );
    }
    for (const e of data.weightEntries) {
      await db.runAsync(
        'INSERT INTO weight_entries (id, weight_kg, measured_at, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
        [e.id, e.weightKg, e.measuredAt, e.note, e.createdAt, e.updatedAt],
      );
    }
    for (const m of data.bodyMeasurements) {
      await db.runAsync(
        'INSERT INTO body_measurements (id, type, value_cm, measured_at, note, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [m.id, m.type, m.valueCm, m.measuredAt, m.note, m.createdAt, m.updatedAt],
      );
    }
    for (const g of data.goals) {
      await db.runAsync('INSERT INTO goals (id, goal_type, target_weight_kg, started_at, created_at) VALUES (?, ?, ?, ?, ?)', [
        g.id,
        g.goalType,
        g.targetWeightKg,
        g.startedAt,
        g.createdAt,
      ]);
    }
    for (const [key, value] of Object.entries(data.settings)) {
      await db.runAsync('INSERT INTO settings (key, value) VALUES (?, ?)', [key, String(value)]);
    }
  });
}
