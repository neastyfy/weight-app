import { createProfile, loadProfile } from '@/features/profile/profileRepository';
import { buildProfileFromDraft, createEmptyDraft } from '@/features/profile/profileModel';
import { migrateDatabase } from '@/storage/database';
import { createTestDatabase } from '@/storage/testing/testDatabase';

import { findGoalAt } from '../goalModel';
import { listGoals, setGoal } from '../goalsRepository';

async function dbWithProfile(targetWeight) {
  const db = await createTestDatabase();
  await migrateDatabase(db);
  const draft = { ...createEmptyDraft(), nickname: 'Алекс', height: 175, weight: 72, age: 30, targetWeight };
  const { profile, initialWeightKg } = buildProfileFromDraft(draft, new Date('2026-10-18T10:00:00.000Z'));
  await createProfile(db, profile, initialWeightKg);
  return db;
}

describe('цели', () => {
  it('тип цели определяется по данным онбординга и попадает в историю', async () => {
    const db = await dbWithProfile(68);
    expect(await loadProfile(db)).toMatchObject({ targetWeightKg: 68, goalType: 'lose' });
    expect((await listGoals(db)).map((g) => g.goalType)).toEqual(['lose']);
  });

  it('онбординг без цели — «без цели»', async () => {
    const db = await dbWithProfile(null);
    expect(await loadProfile(db)).toMatchObject({ targetWeightKg: null, goalType: 'none' });
    expect((await listGoals(db))[0].goalType).toBe('none');
  });

  it('новая цель обновляет профиль и не стирает историю', async () => {
    const db = await dbWithProfile(68);
    await setGoal(db, { goalType: 'maintain', targetWeightKg: 67.8, startedAt: '2026-11-20T09:00:00.000Z' });
    expect(await loadProfile(db)).toMatchObject({ targetWeightKg: 67.8, goalType: 'maintain' });
    const goals = await listGoals(db);
    expect(goals.map((g) => g.goalType)).toEqual(['lose', 'maintain']);
    // запись до смены цели относится к похудению, после — к удержанию
    expect(findGoalAt(goals, '2026-11-01T08:00:00.000Z').goalType).toBe('lose');
    expect(findGoalAt(goals, '2026-11-21T08:00:00.000Z').goalType).toBe('maintain');
  });

  it('можно убрать цель', async () => {
    const db = await dbWithProfile(68);
    await setGoal(db, { goalType: 'none', targetWeightKg: 60, startedAt: '2026-11-20T09:00:00.000Z' });
    expect(await loadProfile(db)).toMatchObject({ targetWeightKg: null, goalType: 'none' });
  });
});

describe('изменение, удаление и повторная постановка цели', () => {
  it('каждое действие — новая строка истории со своей датой, старые не меняются', async () => {
    const db = await dbWithProfile(68);
    const first = (await listGoals(db))[0];
    await setGoal(db, { goalType: 'lose', targetWeightKg: 66, startedAt: '2026-10-25T09:00:00.000Z' }); // изменили
    await setGoal(db, { goalType: 'none', targetWeightKg: null, startedAt: '2026-11-01T09:00:00.000Z' }); // убрали
    expect(await loadProfile(db)).toMatchObject({ targetWeightKg: null, goalType: 'none' });
    await setGoal(db, { goalType: 'lose', targetWeightKg: 65, startedAt: '2026-11-10T09:00:00.000Z' }); // поставили снова

    const goals = await listGoals(db);
    expect(goals.map((g) => [g.goalType, g.targetWeightKg])).toEqual([
      ['lose', 68],
      ['lose', 66],
      ['none', null],
      ['lose', 65],
    ]);
    expect(goals[0]).toEqual(first); // самая первая цель осталась как была
    expect(await loadProfile(db)).toMatchObject({ targetWeightKg: 65, goalType: 'lose' });
  });
});
