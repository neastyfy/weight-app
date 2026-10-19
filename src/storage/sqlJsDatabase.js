// Обёртка над базой sql.js (SQLite на WebAssembly) с тем же асинхронным интерфейсом,
// что у expo-sqlite: runAsync, getFirstAsync, getAllAsync, execAsync, withTransactionAsync.
// Используется в браузере (sqlite.web.js) и в тестах (testing/testDatabase.js).
//
// onChange — вызывается после каждого изменения данных вне транзакции
// и после успешной транзакции (в браузере так база сохраняется на устройстве).

function cleanParams(params) {
  return params.map((p) => (p === undefined ? null : p));
}

export function wrapSqlJsDatabase(raw, { onChange = () => {} } = {}) {
  let inTransaction = false;

  const all = (sql, params = []) => {
    const statement = raw.prepare(sql);
    try {
      statement.bind(cleanParams(params));
      const rows = [];
      while (statement.step()) rows.push(statement.getAsObject());
      return rows;
    } finally {
      statement.free();
    }
  };

  const changed = () => {
    if (!inTransaction) onChange();
  };

  return {
    raw,
    async execAsync(sql) {
      raw.exec(sql);
      changed();
    },
    async runAsync(sql, params = []) {
      raw.run(sql, cleanParams(params));
      const changes = raw.getRowsModified();
      const lastInsertRowId = all('SELECT last_insert_rowid() AS id')[0].id;
      changed();
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
      inTransaction = true;
      try {
        await task();
        raw.exec('COMMIT');
      } catch (error) {
        raw.exec('ROLLBACK');
        throw error;
      } finally {
        inTransaction = false;
      }
      onChange();
    },
  };
}
