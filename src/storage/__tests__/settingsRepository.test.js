import { migrateDatabase } from '../database';
import { SETTING_KEYS, getAllSettings, getSetting, setSetting } from '../settingsRepository';
import { createTestDatabase } from '../testing/testDatabase';

describe('настройки', () => {
  it('сохраняются между перезапусками приложения', async () => {
    const db = await createTestDatabase();
    await migrateDatabase(db);
    await setSetting(db, SETTING_KEYS.language, 'de');
    await setSetting(db, SETTING_KEYS.theme, 'dark');
    await setSetting(db, SETTING_KEYS.reminderTime, '07:30');

    // «перезапуск»: база сохраняется в файл и открывается заново, миграции повторно не ломают данные
    const reopened = await db.reopen();
    await migrateDatabase(reopened);
    expect(await getSetting(reopened, SETTING_KEYS.language)).toBe('de');
    expect(await getSetting(reopened, SETTING_KEYS.theme)).toBe('dark');
    expect(await getAllSettings(reopened)).toMatchObject({ language: 'de', theme: 'dark', reminderTime: '07:30' });
  });

  it('повторная запись заменяет значение', async () => {
    const db = await createTestDatabase();
    await migrateDatabase(db);
    await setSetting(db, SETTING_KEYS.theme, 'dark');
    await setSetting(db, SETTING_KEYS.theme, 'light');
    expect(await getSetting(db, SETTING_KEYS.theme)).toBe('light');
    expect(await getSetting(db, 'unknown')).toBeNull();
  });
});
