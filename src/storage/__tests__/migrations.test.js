import { migrateDatabase } from '../database';
import { MIGRATIONS } from '../migrations';
import { createTestDatabase } from '../testing/testDatabase';

// Применяет только первые n миграций — «старая версия приложения»
async function migrateTo(db, version) {
  for (let v = 1; v <= version; v += 1) {
    await db.execAsync(MIGRATIONS[v - 1]);
    await db.execAsync(`PRAGMA user_version = ${v}`);
  }
}

describe('миграции базы', () => {
  it('новая база получает последнюю версию схемы', async () => {
    const db = await createTestDatabase();
    await migrateDatabase(db);
    const { user_version: version } = await db.getFirstAsync('PRAGMA user_version');
    expect(version).toBe(MIGRATIONS.length);
    const tables = (await db.getAllAsync("SELECT name FROM sqlite_master WHERE type = 'table'")).map((r) => r.name);
    expect(tables).toEqual(expect.arrayContaining(['settings', 'profile', 'weight_entries', 'body_measurements']));
  });

  it('обновление со старой версии не теряет профиль и первую запись веса', async () => {
    const db = await createTestDatabase();
    await migrateTo(db, 2); // база версии из этапа 2
    await db.runAsync(
      `INSERT INTO profile (id, nickname, mascot_id, height_cm, age_years, age_recorded_at, sex, weight_unit, height_unit,
        activity_answers, target_weight_kg, created_at, updated_at, photo_uri)
       VALUES (1, 'Алекс', 'peach', 175, 28, '2026-10-18T10:00:00.000Z', NULL, 'kg', 'cm', '[]', 68, '2026-10-18T10:00:00.000Z', '2026-10-18T10:00:00.000Z', NULL)`,
    );
    await db.runAsync(
      "INSERT INTO weight_entries (weight_kg, measured_at, note, created_at) VALUES (72.4, '2026-10-18T10:00:00.000Z', NULL, '2026-10-18T10:00:00.000Z')",
    );

    await migrateDatabase(db);

    const profile = await db.getFirstAsync('SELECT * FROM profile');
    expect(profile.nickname).toBe('Алекс');
    expect(profile.target_weight_kg).toBe(68);
    const weights = await db.getAllAsync('SELECT * FROM weight_entries');
    expect(weights).toHaveLength(1);
    expect(weights[0].weight_kg).toBe(72.4);
    expect(weights[0].updated_at).toBeNull(); // новая колонка, старые данные не тронуты
  });

  it('миграция 4 вычисляет тип цели существующего профиля и начинает историю целей', async () => {
    const db = await createTestDatabase();
    await migrateTo(db, 3); // база этапа 3
    await db.runAsync(
      `INSERT INTO profile (id, nickname, mascot_id, height_cm, age_years, age_recorded_at, sex, weight_unit, height_unit,
        activity_answers, target_weight_kg, created_at, updated_at, photo_uri)
       VALUES (1, 'Алекс', 'peach', 175, 28, '2026-10-18T10:00:00.000Z', NULL, 'kg', 'cm', '[]', 68, '2026-10-18T10:00:00.000Z', '2026-10-18T10:00:00.000Z', NULL)`,
    );
    await db.runAsync(
      "INSERT INTO weight_entries (weight_kg, measured_at, note, created_at) VALUES (72.4, '2026-10-18T10:00:00.000Z', NULL, '2026-10-18T10:00:00.000Z')",
    );
    await migrateDatabase(db);
    expect((await db.getFirstAsync('SELECT goal_type FROM profile')).goal_type).toBe('lose');
    const goals = await db.getAllAsync('SELECT * FROM goals');
    expect(goals).toHaveLength(1);
    expect(goals[0]).toMatchObject({ goal_type: 'lose', target_weight_kg: 68, started_at: '2026-10-18T10:00:00.000Z' });
    expect(await db.getAllAsync('SELECT * FROM weight_entries')).toHaveLength(1); // записи на месте
  });

  it('миграция 4: профиль без цели получает «без цели» в истории', async () => {
    const db = await createTestDatabase();
    await migrateTo(db, 3);
    await db.runAsync(
      `INSERT INTO profile (id, nickname, mascot_id, height_cm, age_years, age_recorded_at, sex, weight_unit, height_unit,
        activity_answers, target_weight_kg, created_at, updated_at, photo_uri)
       VALUES (1, 'Сэм', 'peach', 170, 30, '2026-10-18T10:00:00.000Z', NULL, 'kg', 'cm', '[]', NULL, '2026-10-18T10:00:00.000Z', '2026-10-18T10:00:00.000Z', NULL)`,
    );
    await migrateDatabase(db);
    expect((await db.getFirstAsync('SELECT goal_type FROM profile')).goal_type).toBeNull();
    expect((await db.getFirstAsync('SELECT goal_type FROM goals')).goal_type).toBe('none');
  });

  it('повторный запуск миграций ничего не меняет', async () => {
    const db = await createTestDatabase();
    await migrateDatabase(db);
    await db.runAsync("INSERT INTO settings (key, value) VALUES ('language', 'ru')");
    await migrateDatabase(db);
    expect(await db.getFirstAsync('SELECT value FROM settings')).toEqual({ value: 'ru' });
  });
});

describe('миграция 5 — версии профиля', () => {
  it('текущий профиль становится первой версией, действующей с даты создания', async () => {
    const db = await createTestDatabase();
    await migrateTo(db, 4);
    await db.runAsync(
      `INSERT INTO profile (id, nickname, mascot_id, height_cm, age_years, age_recorded_at, sex, weight_unit, height_unit,
        activity_answers, target_weight_kg, created_at, updated_at, photo_uri, goal_type)
       VALUES (1, 'Алекс', 'peach', 175, 28, '2026-10-18T10:00:00.000Z', 'male', 'kg', 'cm', '["gym"]', NULL, '2026-10-18T10:00:00.000Z', '2026-10-18T10:00:00.000Z', NULL, NULL)`,
    );
    await migrateDatabase(db);
    const versions = await db.getAllAsync('SELECT * FROM profile_versions');
    expect(versions).toHaveLength(1);
    expect(versions[0]).toMatchObject({
      height_cm: 175,
      age_years: 28,
      sex: 'male',
      activity_answers: '["gym"]',
      effective_from: '2026-10-18T10:00:00.000Z',
    });
    // профиль не изменился
    expect((await db.getFirstAsync('SELECT nickname FROM profile')).nickname).toBe('Алекс');
  });

  it('без профиля версий нет', async () => {
    const db = await createTestDatabase();
    await migrateDatabase(db);
    expect(await db.getAllAsync('SELECT * FROM profile_versions')).toEqual([]);
  });
});
