// Только для тестов — в приложении не используется.
// Тестовая база: настоящий SQLite (sql.js, WebAssembly) с тем же асинхронным
// интерфейсом, что у expo-sqlite (см. ../sqlJsDatabase.js).
import initSqlJs from 'sql.js';

import { wrapSqlJsDatabase } from '../sqlJsDatabase';

let sqlPromise = null;
function loadSql() {
  sqlPromise ??= initSqlJs();
  return sqlPromise;
}

function wrap(raw) {
  return {
    ...wrapSqlJsDatabase(raw),
    // «Перезапуск приложения»: сохранить файл базы и открыть его заново
    async reopen() {
      const SQL = await loadSql();
      return wrap(new SQL.Database(raw.export()));
    },
  };
}

export async function createTestDatabase() {
  const SQL = await loadSql();
  return wrap(new SQL.Database());
}
