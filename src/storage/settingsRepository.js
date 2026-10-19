// Настройки приложения в формате «ключ — значение» (например, язык интерфейса).
// db — база из useSQLiteContext()

export const SETTING_KEYS = {
  language: 'language',
  celebratedGoalId: 'celebratedGoalId', // id цели, с достижением которой уже поздравили
  motivationIndex: 'motivationIndex', // номер последней показанной мотивирующей фразы на Главной
  theme: 'theme', // тема: system, light или dark
  reminderEnabled: 'reminderEnabled', // напоминание о взвешивании: 'true' / 'false'
  reminderTime: 'reminderTime', // время напоминания «08:00» (местное)
};

export async function getSetting(db, key) {
  const row = await db.getFirstAsync('SELECT value FROM settings WHERE key = ?', [key]);
  return row ? row.value : null;
}

export async function setSetting(db, key, value) {
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT (key) DO UPDATE SET value = excluded.value',
    [key, String(value)],
  );
}

// Все настройки как объект { ключ: значение } (для резервной копии)
export async function getAllSettings(db) {
  const rows = await db.getAllAsync('SELECT key, value FROM settings');
  return Object.fromEntries(rows.map((row) => [row.key, row.value]));
}
