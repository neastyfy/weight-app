import { migrateDatabase } from '@/storage/database';
import { createTestDatabase } from '@/storage/testing/testDatabase';

import { createProfile, deleteAllUserData, listProfileVersions, loadProfile, updateProfile } from '../profileRepository';
import { findProfileVersionAt, versionedParamsChanged } from '../profileVersions';

const CREATED = '2026-09-01T10:00:00.000Z';

async function setup() {
  const db = await createTestDatabase();
  await migrateDatabase(db);
  await createProfile(
    db,
    {
      nickname: 'Алекс',
      mascotId: 'peach',
      photoUri: null,
      heightCm: 175,
      ageYears: 28,
      ageRecordedAt: CREATED,
      sex: null,
      weightUnit: 'kg',
      heightUnit: 'cm',
      activityAnswers: ['gym'],
      targetWeightKg: null,
      goalType: 'none',
      createdAt: CREATED,
      updatedAt: CREATED,
    },
    80,
  );
  return db;
}

describe('версии профиля в базе', () => {
  it('при создании профиля появляется первая версия', async () => {
    const db = await setup();
    const versions = await listProfileVersions(db);
    expect(versions).toHaveLength(1);
    expect(versions[0]).toMatchObject({ heightCm: 175, ageYears: 28, effectiveFrom: CREATED, activityAnswers: ['gym'] });
  });

  it('смена роста — новая версия с датой изменения, старая не меняется', async () => {
    const db = await setup();
    await updateProfile(db, { heightCm: 177 }, new Date('2026-10-01T09:00:00.000Z'));
    const versions = await listProfileVersions(db);
    expect(versions.map((v) => v.heightCm)).toEqual([175, 177]);
    expect(versions[1].effectiveFrom).toBe('2026-10-01T09:00:00.000Z');
    expect((await loadProfile(db)).heightCm).toBe(177);
  });

  it('смена возраста обновляет дату его указания', async () => {
    const db = await setup();
    await updateProfile(db, { ageYears: 30 }, new Date('2026-10-01T09:00:00.000Z'));
    const profile = await loadProfile(db);
    expect(profile.ageRecordedAt).toBe('2026-10-01T09:00:00.000Z');
    expect((await listProfileVersions(db))[1].ageYears).toBe(30);
  });

  it('имя, маскот и единицы не создают версий', async () => {
    const db = await setup();
    await updateProfile(db, { nickname: 'Саша', mascotId: 'snowflake', weightUnit: 'lb', heightUnit: 'in' });
    expect(await listProfileVersions(db)).toHaveLength(1);
    expect(await loadProfile(db)).toMatchObject({ nickname: 'Саша', mascotId: 'snowflake', weightUnit: 'lb', heightUnit: 'in' });
  });

  it('изменение профиля не трогает историю измерений', async () => {
    const db = await setup();
    await updateProfile(db, { heightCm: 180, sex: 'male', activityAnswers: [] });
    expect(await db.getAllAsync('SELECT * FROM weight_entries')).toHaveLength(1);
    expect(await db.getAllAsync('SELECT * FROM goals')).toHaveLength(1);
  });

  it('полное удаление данных удаляет и версии', async () => {
    const db = await setup();
    await deleteAllUserData(db);
    expect(await listProfileVersions(db)).toEqual([]);
  });
});

describe('версия на дату', () => {
  const versions = [
    { id: 2, heightCm: 177, effectiveFrom: '2026-10-01T09:00:00.000Z' },
    { id: 1, heightCm: 175, effectiveFrom: CREATED },
  ];

  it('действующая версия по дате', () => {
    expect(findProfileVersionAt(versions, '2026-09-15T08:00:00.000Z').heightCm).toBe(175);
    expect(findProfileVersionAt(versions, '2026-10-01T09:00:00.000Z').heightCm).toBe(177);
    expect(findProfileVersionAt(versions, '2026-10-19T08:00:00.000Z').heightCm).toBe(177);
  });

  it('раньше первой версии — неизвестно (null), а не текущие значения', () => {
    expect(findProfileVersionAt(versions, '2026-08-01T08:00:00.000Z')).toBeNull();
    expect(findProfileVersionAt([], CREATED)).toBeNull();
  });

  it('что считается изменением параметров', () => {
    const base = { heightCm: 175, ageYears: 28, sex: null, activityAnswers: ['a', 'b'] };
    expect(versionedParamsChanged(base, { ...base, activityAnswers: ['b', 'a'] })).toBe(false);
    expect(versionedParamsChanged(base, { ...base, sex: 'male' })).toBe(true);
    expect(versionedParamsChanged(base, { ...base, nickname: 'x' })).toBe(false);
  });
});
