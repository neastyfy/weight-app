import { setGoal } from '@/features/goals/goalsRepository';
import { addBodyMeasurement } from '@/features/measurements/bodyMeasurementRepository';
import { addWeightEntry } from '@/features/measurements/weightRepository';
import { createProfile, deleteAllUserData, listProfileVersions, loadProfile, updateProfile } from '@/features/profile/profileRepository';
import { migrateDatabase } from '@/storage/database';
import { SETTING_KEYS, getAllSettings, setSetting } from '@/storage/settingsRepository';
import { createTestDatabase } from '@/storage/testing/testDatabase';

import { BACKUP_FORMAT, BACKUP_VERSION, createBackup, parseBackup } from '../backupFormat';
import { readBackupData, restoreBackupData } from '../backupRepository';
import { bodyMeasurementsToCsv, toCsv, weightEntriesToCsv } from '../csvExport';

const NOW = new Date('2026-10-19T12:00:00.000Z');
const CREATED = '2026-09-01T10:00:00.000Z';

const PROFILE = {
  nickname: 'Алекс',
  mascotId: 'peach',
  photoUri: null,
  heightCm: 175,
  ageYears: 28,
  ageRecordedAt: CREATED,
  sex: 'male',
  weightUnit: 'kg',
  heightUnit: 'cm',
  activityAnswers: ['gym'],
  targetWeightKg: 75,
  goalType: 'lose',
  createdAt: CREATED,
  updatedAt: CREATED,
};

async function emptyDb() {
  const db = await createTestDatabase();
  await migrateDatabase(db);
  return db;
}

// База с данными «как у пользователя»
async function filledDb() {
  const db = await emptyDb();
  await createProfile(db, PROFILE, 80);
  await addWeightEntry(db, { weightKg: 79.4, measuredAt: '2026-09-10T07:00:00.000Z', note: 'утром, "натощак", после зала' }, { now: NOW });
  await addWeightEntry(db, { weightKg: 78.9, measuredAt: '2026-10-01T07:00:00.000Z', note: null }, { now: NOW });
  await addBodyMeasurement(db, { type: 'waist', valueCm: 84, measuredAt: '2026-09-10T07:05:00.000Z', note: null }, { now: NOW });
  await setGoal(db, { goalType: 'lose', targetWeightKg: 74, startedAt: '2026-10-05T10:00:00.000Z' });
  await updateProfile(db, { heightCm: 176 }, new Date('2026-10-06T10:00:00.000Z'));
  await setSetting(db, SETTING_KEYS.language, 'ru');
  await setSetting(db, SETTING_KEYS.theme, 'dark');
  await setSetting(db, SETTING_KEYS.reminderTime, '08:00');
  return db;
}

async function exportText(db) {
  return JSON.stringify(createBackup(await readBackupData(db), { now: NOW }));
}

const tableCounts = async (db) => ({
  weights: (await db.getAllAsync('SELECT * FROM weight_entries')).length,
  body: (await db.getAllAsync('SELECT * FROM body_measurements')).length,
  goals: (await db.getAllAsync('SELECT * FROM goals')).length,
  versions: (await db.getAllAsync('SELECT * FROM profile_versions')).length,
});

describe('экспорт и восстановление', () => {
  it('копия переносится в другой экземпляр приложения без потерь', async () => {
    const source = await filledDb();
    const text = await exportText(source);
    const parsed = parseBackup(text, { now: NOW });
    expect(parsed.ok).toBe(true);
    expect(parsed.summary).toMatchObject({ nickname: 'Алекс', weightCount: 3, bodyCount: 1, goalCount: 2 });

    const target = await emptyDb();
    await setSetting(target, SETTING_KEYS.reminderTime, '21:00'); // настройка устройства
    await restoreBackupData(target, parsed.data);

    expect(await readBackupData(target)).toEqual(await readBackupData(source));
    expect(await tableCounts(target)).toEqual({ weights: 3, body: 1, goals: 2, versions: 2 });
    // напоминание — от устройства, а не из копии
    expect((await getAllSettings(target)).reminderTime).toBe('21:00');
    expect((await getAllSettings(target)).theme).toBe('dark');
  });

  it('в копии есть формат, версия, дата и метаданные', async () => {
    const backup = JSON.parse(await exportText(await filledDb()));
    expect(backup).toMatchObject({ format: BACKUP_FORMAT, version: BACKUP_VERSION, exportedAt: NOW.toISOString() });
    expect(backup.data.profileVersions).toHaveLength(2);
    // напоминания — настройка устройства, в копию не попадают
    expect(backup.data.settings.reminderTime).toBeUndefined();
  });
});

describe('повреждённые и несовместимые копии', () => {
  let valid;
  beforeAll(async () => {
    valid = JSON.parse(await exportText(await filledDb()));
  });
  const withData = (patch) => JSON.stringify({ ...valid, data: { ...valid.data, ...patch } });

  it('не JSON', () => {
    expect(parseBackup('{ это не json', { now: NOW })).toEqual({ ok: false, error: 'invalidJson' });
    expect(parseBackup('', { now: NOW }).error).toBe('invalidJson');
  });

  it('чужой файл и неподдерживаемые версии', () => {
    expect(parseBackup(JSON.stringify({ hello: 'world' })).error).toBe('wrongFormat');
    expect(parseBackup(JSON.stringify([1, 2])).error).toBe('wrongFormat');
    expect(parseBackup(JSON.stringify({ ...valid, version: 99 })).error).toBe('newerVersion');
    expect(parseBackup(JSON.stringify({ ...valid, version: '1' })).error).toBe('unsupportedVersion');
  });

  it('значения вне диапазона и неверные типы отклоняют весь файл', () => {
    const badWeight = parseBackup(withData({ weightEntries: [{ id: 1, weightKg: 9999, measuredAt: CREATED, createdAt: CREATED }] }), { now: NOW });
    expect(badWeight.ok).toBe(false);
    expect(badWeight.error).toBe('invalidData');
    expect(badWeight.details[0].path).toBe('weightEntries[0].weightKg');

    expect(parseBackup(withData({ weightEntries: [{ weightKg: '80', measuredAt: CREATED }] }), { now: NOW }).ok).toBe(false);
    expect(parseBackup(withData({ weightEntries: 'много' }), { now: NOW }).ok).toBe(false);
    expect(parseBackup(withData({ bodyMeasurements: [{ type: 'tail', valueCm: 30, measuredAt: CREATED }] }), { now: NOW }).ok).toBe(false);
    expect(parseBackup(withData({ profile: { ...valid.data.profile, heightCm: 20 } }), { now: NOW }).ok).toBe(false);
    expect(parseBackup(withData({ profile: null }), { now: NOW }).ok).toBe(false);
  });

  it('даты в будущем и некорректные даты отклоняются', () => {
    const future = parseBackup(withData({ weightEntries: [{ weightKg: 80, measuredAt: '2030-01-01T00:00:00.000Z' }] }), { now: NOW });
    expect(future.ok).toBe(false);
    expect(parseBackup(withData({ weightEntries: [{ weightKg: 80, measuredAt: 'вчера' }] }), { now: NOW }).ok).toBe(false);
  });

  it('неизвестные поля игнорируются, необязательные — подставляются', () => {
    const parsed = parseBackup(
      withData({
        weightEntries: [{ weightKg: 80, measuredAt: CREATED, hack: '<script>', __proto__: { admin: true } }],
        profileVersions: undefined,
        settings: { theme: 'neon', language: 'xx', evil: 'rm -rf' },
        extra: { anything: 1 },
      }),
      { now: NOW },
    );
    expect(parsed.ok).toBe(true);
    expect(parsed.data.weightEntries[0]).toEqual({ id: 1, weightKg: 80, measuredAt: CREATED, note: null, createdAt: CREATED, updatedAt: null });
    expect(parsed.data.settings).toEqual({});
    expect(parsed.data.profileVersions).toHaveLength(1); // собрана из профиля
    expect(parsed.warnings.map((w) => w.code)).toContain('versionsCreated');
  });

  it('испорченное фото не мешает импорту — пропускается с предупреждением', () => {
    const parsed = parseBackup(withData({ profile: { ...valid.data.profile, photoUri: 'javascript:alert(1)' } }), { now: NOW });
    expect(parsed.ok).toBe(true);
    expect(parsed.data.profile.photoUri).toBeNull();
    expect(parsed.warnings.map((w) => w.code)).toContain('photoSkipped');
  });
});

describe('отмена и транзакционность', () => {
  it('разбор файла без подтверждения ничего не меняет в базе (отмена импорта)', async () => {
    const db = await filledDb();
    const before = await readBackupData(db);
    const other = await emptyDb();
    await createProfile(other, { ...PROFILE, nickname: 'Другой' }, 90);
    const parsed = parseBackup(await exportText(other), { now: NOW });
    expect(parsed.ok).toBe(true);
    // пользователь нажал «Отмена» — restoreBackupData не вызывается
    expect(await readBackupData(db)).toEqual(before);
  });

  it('ошибка во время записи откатывает всё — данные остаются прежними', async () => {
    const db = await filledDb();
    const before = await readBackupData(db);
    const parsed = parseBackup(await exportText(db), { now: NOW });
    // портим данные уже после проверки: вторая запись нарушит ограничение базы (вес > 0)
    const broken = { ...parsed.data, weightEntries: [parsed.data.weightEntries[0], { ...parsed.data.weightEntries[1], weightKg: -1 }] };
    await expect(restoreBackupData(db, broken)).rejects.toThrow();
    expect(await readBackupData(db)).toEqual(before);
    expect((await loadProfile(db)).nickname).toBe('Алекс');
  });
});

describe('полное удаление данных', () => {
  it('удаляет профиль, версии, измерения, цели и настройки', async () => {
    const db = await filledDb();
    await deleteAllUserData(db);
    expect(await loadProfile(db)).toBeNull();
    expect(await listProfileVersions(db)).toEqual([]);
    expect(await tableCounts(db)).toEqual({ weights: 0, body: 0, goals: 0, versions: 0 });
    expect(await getAllSettings(db)).toEqual({});
  });
});

describe('CSV', () => {
  it('кавычки, запятые, переносы строк и формулы экранируются; есть BOM', () => {
    const csv = toCsv(['a', 'b'], [['x, y', 'он сказал "да"'], ['строка\nвторая', '=SUM(A1)'], [1.25, null]]);
    expect(csv.startsWith('﻿')).toBe(true);
    expect(csv).toBe('﻿a,b\r\n"x, y","он сказал ""да"""\r\n"строка\nвторая",\'=SUM(A1)\r\n1.25,\r\n');
  });

  const labels = {
    date: 'Дата', time: 'Время', weightKg: 'Вес, кг', weightInUnit: 'Вес, фунт', note: 'Комментарий', measuredAtUtc: 'UTC',
    type: 'Код', typeName: 'Вид', valueCm: 'Значение, см', valueInUnit: 'Значение, дюйм',
  };

  it('вес: точность не теряется, фунты — дополнительным столбцом, по дате', async () => {
    const entries = [
      { id: 2, weightKg: 78.912345, measuredAt: '2026-10-01T07:00:00.000Z', note: null },
      { id: 1, weightKg: 80, measuredAt: '2026-09-01T07:00:00.000Z', note: 'a, b' },
    ];
    const csv = weightEntriesToCsv(entries, { unit: 'lb', labels });
    const lines = csv.replace('﻿', '').trim().split('\r\n');
    expect(lines[0]).toBe('Дата,Время,"Вес, кг","Вес, фунт",Комментарий,UTC');
    expect(lines[1]).toContain(',80,176.4,"a, b",2026-09-01T07:00:00.000Z');
    expect(lines[2]).toContain(',78.912345,174,');
  });

  it('окружности: код вида и название', () => {
    const csv = bodyMeasurementsToCsv([{ id: 1, type: 'waist', valueCm: 84, measuredAt: '2026-09-10T07:05:00.000Z', note: null }], {
      unit: 'cm',
      labels,
      typeName: () => 'Талия',
    });
    expect(csv).toContain(',waist,Талия,84,,2026-09-10T07:05:00.000Z');
  });
});

describe('состав экспорта', () => {
  it('в копии только ожидаемые поля — ничего лишнего', async () => {
    const backup = JSON.parse(await exportText(await filledDb()));
    expect(Object.keys(backup).sort()).toEqual(['app', 'data', 'exportedAt', 'format', 'version']);
    expect(Object.keys(backup.data).sort()).toEqual(['bodyMeasurements', 'goals', 'profile', 'profileVersions', 'settings', 'weightEntries']);
    expect(Object.keys(backup.data.profile).sort()).toEqual(
      [
        'activityAnswers', 'ageRecordedAt', 'ageYears', 'createdAt', 'goalType', 'heightCm', 'heightUnit', 'mascotId',
        'nickname', 'photoUri', 'sex', 'targetWeightKg', 'updatedAt', 'weightUnit',
      ].sort(),
    );
    expect(Object.keys(backup.data.weightEntries[0]).sort()).toEqual(['createdAt', 'id', 'measuredAt', 'note', 'updatedAt', 'weightKg']);
    expect(Object.keys(backup.data.bodyMeasurements[0]).sort()).toEqual(['createdAt', 'id', 'measuredAt', 'note', 'type', 'updatedAt', 'valueCm']);
    expect(Object.keys(backup.data.settings).sort()).toEqual(['language', 'theme']);
  });
});
