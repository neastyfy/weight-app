import { createProfile, loadProfile } from '@/features/profile/profileRepository';
import { migrateDatabase } from '@/storage/database';
import { createTestDatabase } from '@/storage/testing/testDatabase';

import {
  addBodyMeasurement,
  deleteBodyMeasurement,
  listBodyMeasurements,
  listBodyMeasurementsByType,
  updateBodyMeasurement,
} from '../bodyMeasurementRepository';
import { DuplicateError, NotFoundError, ValidationError } from '../errors';
import { addWeightEntry, deleteWeightEntry, getLatestWeightEntry, listWeightEntries, updateWeightEntry } from '../weightRepository';

const NOW = new Date('2026-10-19T12:00:00.000Z');
const opts = { now: NOW };

async function freshDb() {
  const db = await createTestDatabase();
  await migrateDatabase(db);
  return db;
}

describe('записи веса', () => {
  it('пустая история', async () => {
    const db = await freshDb();
    expect(await listWeightEntries(db)).toEqual([]);
    expect(await getLatestWeightEntry(db)).toBeNull();
  });

  it('добавление, редактирование и удаление', async () => {
    const db = await freshDb();
    const added = await addWeightEntry(db, { weightKg: 72.4, measuredAt: '2026-10-19T06:30:00.000Z', note: '  утром  ' }, opts);
    expect(added).toMatchObject({ weightKg: 72.4, note: 'утром', updatedAt: null });
    expect(typeof added.id).toBe('number');

    const updated = await updateWeightEntry(db, added.id, { weightKg: 72.1, measuredAt: added.measuredAt, note: '' }, opts);
    expect(updated).toMatchObject({ id: added.id, weightKg: 72.1, note: null, updatedAt: NOW.toISOString() });

    await deleteWeightEntry(db, added.id);
    expect(await listWeightEntries(db)).toEqual([]);
    await expect(deleteWeightEntry(db, added.id)).rejects.toBeInstanceOf(NotFoundError);
    await expect(updateWeightEntry(db, 999, { weightKg: 70, measuredAt: NOW }, opts)).rejects.toBeInstanceOf(NotFoundError);
  });

  it('сортирует по реальной дате: записи задним числом и несколько в один день', async () => {
    const db = await freshDb();
    const today = await addWeightEntry(db, { weightKg: 72, measuredAt: '2026-10-19T06:00:00.000Z' }, opts);
    const backdated = await addWeightEntry(db, { weightKg: 74, measuredAt: '2026-10-01T06:00:00.000Z' }, opts);
    const evening = await addWeightEntry(db, { weightKg: 72.8, measuredAt: '2026-10-19T19:00:00.000Z' }, { now: new Date('2026-10-19T20:00:00Z') });
    const list = await listWeightEntries(db);
    expect(list.map((e) => e.id)).toEqual([evening.id, today.id, backdated.id]);
    expect((await getLatestWeightEntry(db)).id).toBe(evening.id);
  });

  it('проверяет данные', async () => {
    const db = await freshDb();
    for (const weightKg of [0, -5, Number.NaN, '72', 1000]) {
      await expect(addWeightEntry(db, { weightKg, measuredAt: NOW }, opts)).rejects.toBeInstanceOf(ValidationError);
    }
    await expect(addWeightEntry(db, { weightKg: 70, measuredAt: '2026-10-25T00:00:00.000Z' }, opts)).rejects.toMatchObject({
      errors: { measuredAt: { key: 'errors.futureDate' } },
    });
    await expect(addWeightEntry(db, { weightKg: 70, measuredAt: 'вчера' }, opts)).rejects.toBeInstanceOf(ValidationError);
    await expect(addWeightEntry(db, { weightKg: 70, measuredAt: NOW, note: 'а'.repeat(281) }, opts)).rejects.toBeInstanceOf(
      ValidationError,
    );
    expect(await listWeightEntries(db)).toEqual([]);
  });

  it('защищает от случайного дубля, но разрешает его по подтверждению', async () => {
    const db = await freshDb();
    const first = await addWeightEntry(db, { weightKg: 72.4, measuredAt: '2026-10-19T06:00:00.000Z' }, opts);
    // сохранение записи без изменений — не дубль самой себя
    await expect(updateWeightEntry(db, first.id, { weightKg: 72.4, measuredAt: first.measuredAt }, opts)).resolves.toBeTruthy();
    const duplicate = { weightKg: 72.4, measuredAt: '2026-10-19T06:03:00.000Z' };
    await expect(addWeightEntry(db, duplicate, opts)).rejects.toMatchObject({ name: 'DuplicateError', duplicate: { id: first.id } });
    await expect(addWeightEntry(db, duplicate, { ...opts, allowDuplicate: true })).resolves.toMatchObject({ weightKg: 72.4 });
    // другое значение или другое время — не дубль
    await expect(addWeightEntry(db, { weightKg: 72.6, measuredAt: '2026-10-19T06:01:00.000Z' }, opts)).resolves.toBeTruthy();
    await expect(addWeightEntry(db, { weightKg: 72.4, measuredAt: '2026-10-19T09:00:00.000Z' }, opts)).resolves.toBeTruthy();
  });

  it('первая запись из онбординга — обычная запись: видна, редактируется и удаляется', async () => {
    const db = await freshDb();
    const createdAt = '2026-10-18T10:00:00.000Z';
    await createProfile(
      db,
      {
        nickname: 'Алекс',
        mascotId: 'peach',
        heightCm: 175,
        ageYears: 28,
        ageRecordedAt: createdAt,
        sex: null,
        weightUnit: 'kg',
        heightUnit: 'cm',
        activityAnswers: [],
        targetWeightKg: null,
        createdAt,
        updatedAt: createdAt,
      },
      72.4,
    );
    const [first] = await listWeightEntries(db);
    expect(first).toMatchObject({ weightKg: 72.4, measuredAt: createdAt });
    await updateWeightEntry(db, first.id, { weightKg: 72.0, measuredAt: createdAt }, opts);
    expect((await getLatestWeightEntry(db)).weightKg).toBe(72.0);
    await deleteWeightEntry(db, first.id);
    expect(await listWeightEntries(db)).toEqual([]);
    expect(await loadProfile(db)).toMatchObject({ nickname: 'Алекс' }); // профиль не пострадал
  });

  it('данные сохраняются после «перезапуска»', async () => {
    const db = await freshDb();
    await addWeightEntry(db, { weightKg: 71.5, measuredAt: '2026-10-19T06:00:00.000Z' }, opts);
    await addBodyMeasurement(db, { type: 'waist', valueCm: 82.5, measuredAt: '2026-10-19T06:00:00.000Z' }, opts);
    const reopened = await db.reopen();
    await migrateDatabase(reopened);
    expect((await listWeightEntries(reopened))[0].weightKg).toBe(71.5);
    expect((await listBodyMeasurements(reopened))[0].valueCm).toBe(82.5);
  });

  it('хранит вес без округления', async () => {
    const db = await freshDb();
    const kg = 165.3 * 0.45359237; // введено в фунтах
    const saved = await addWeightEntry(db, { weightKg: kg, measuredAt: NOW }, opts);
    expect(saved.weightKg).toBe(kg);
  });
});

describe('окружности тела', () => {
  it('у каждого вида своя история', async () => {
    const db = await freshDb();
    await addBodyMeasurement(db, { type: 'waist', valueCm: 82, measuredAt: '2026-10-10T06:00:00.000Z' }, opts);
    await addBodyMeasurement(db, { type: 'waist', valueCm: 80.5, measuredAt: '2026-10-19T06:00:00.000Z' }, opts);
    await addBodyMeasurement(db, { type: 'neck', valueCm: 37, measuredAt: '2026-10-19T06:00:00.000Z' }, opts);
    const waist = await listBodyMeasurementsByType(db, 'waist');
    expect(waist.map((m) => m.valueCm)).toEqual([80.5, 82]);
    expect(await listBodyMeasurementsByType(db, 'hips')).toEqual([]);
    expect(await listBodyMeasurements(db)).toHaveLength(3);
  });

  it('редактирование не меняет вид, удаление убирает запись', async () => {
    const db = await freshDb();
    const added = await addBodyMeasurement(db, { type: 'arm', valueCm: 30, measuredAt: NOW }, opts);
    const updated = await updateBodyMeasurement(db, added.id, { type: 'waist', valueCm: 31.5, measuredAt: NOW }, opts);
    expect(updated).toMatchObject({ type: 'arm', valueCm: 31.5 });
    await deleteBodyMeasurement(db, added.id);
    expect(await listBodyMeasurements(db)).toEqual([]);
  });

  it('проверяет вид и диапазон, защищает от дублей', async () => {
    const db = await freshDb();
    await expect(addBodyMeasurement(db, { type: 'nose', valueCm: 5, measuredAt: NOW }, opts)).rejects.toBeInstanceOf(ValidationError);
    await expect(addBodyMeasurement(db, { type: 'neck', valueCm: 150, measuredAt: NOW }, opts)).rejects.toBeInstanceOf(ValidationError);
    await expect(addBodyMeasurement(db, { type: 'neck', valueCm: 0, measuredAt: NOW }, opts)).rejects.toBeInstanceOf(ValidationError);
    await addBodyMeasurement(db, { type: 'waist', valueCm: 80, measuredAt: NOW }, opts);
    await expect(addBodyMeasurement(db, { type: 'waist', valueCm: 80, measuredAt: NOW }, opts)).rejects.toBeInstanceOf(DuplicateError);
    // то же значение у другого вида — не дубль
    await expect(addBodyMeasurement(db, { type: 'hips', valueCm: 80, measuredAt: NOW }, opts)).resolves.toBeTruthy();
  });
});
