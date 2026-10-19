// Локальная база данных приложения (SQLite через expo-sqlite).
// Работает на iOS и в браузере. Данные хранятся только на устройстве.
import { MIGRATIONS } from './migrations';

export const DATABASE_NAME = 'weightapp.db';

// Вызывается один раз при открытии базы (см. src/app/_layout.jsx).
// Применяет недостающие миграции по порядку.
export async function migrateDatabase(db) {
  await db.execAsync('PRAGMA foreign_keys = ON;');

  const row = await db.getFirstAsync('PRAGMA user_version');
  const currentVersion = row?.user_version ?? 0;

  for (let version = currentVersion + 1; version <= MIGRATIONS.length; version += 1) {
    // Каждая миграция — в своей транзакции: при ошибке база останется в прежнем состоянии
    await db.withTransactionAsync(async () => {
      await db.execAsync(MIGRATIONS[version - 1]);
      await db.execAsync(`PRAGMA user_version = ${version}`);
    });
  }
}
