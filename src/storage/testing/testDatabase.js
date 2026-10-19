// Только для тестов — в приложении не используется.
// Тестовая база: настоящий SQLite (sql.js, WebAssembly) с тем же асинхронным
// интерфейсом, что у expo-sqlite (runAsync, getFirstAsync, getAllAsync, execAsync,
// withTransactionAsync). Используется только в тестах.
import initSqlJs from 'sql.js';

let sqlPromise = null;
function loadSql() {
  sqlPromise ??= initSqlJs();
  return sqlPromise;
}

function wrap(raw) {
  const all = (sql, params = []) => {
    const statement = raw.prepare(sql);
    statement.bind(params.map((p) => (p === undefined ? null : p)));
    const rows = [];
    while (statement.step()) rows.push(statement.getAsObject());
    statement.free();
    return rows;
  };

  return {
    raw,
    async execAsync(sql) {
      raw.exec(sql);
    },
    async runAsync(sql, params = []) {
      raw.run(sql, params.map((p) => (p === undefined ? null : p)));
      const changes = raw.getRowsModified();
      const lastInsertRowId = all('SELECT last_insert_rowid() AS id')[0].id;
      return { changes, lastInsertRowId };
    },
    async getFirstAsync(sql, params = []) {
      return all(sql, params)[0] ?? null;
    },
    async getAllAsync(sql, params = []) {
      return all(sql, params);
    },
    async withTransactionAsync(task) {
      raw.exec('BEGIN');
      try {
        await task();
        raw.exec('COMMIT');
      } catch (error) {
        raw.exec('ROLLBACK');
        throw error;
      }
    },
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
