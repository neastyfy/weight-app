// ТОЛЬКО ДЛЯ БРАУЗЕРА: хранение файла базы в IndexedDB (см. sqlite.web.js).
// Одна таблица «files»: ключ — имя базы, значение — содержимое файла (Uint8Array).
const DB_NAME = 'weightapp';
const STORE = 'files';

function openStore() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function run(mode, action) {
  const idb = await openStore();
  try {
    return await new Promise((resolve, reject) => {
      const transaction = idb.transaction(STORE, mode);
      const request = action(transaction.objectStore(STORE));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error);
    });
  } finally {
    idb.close();
  }
}

// Содержимое файла или null, если базы ещё нет
export async function readDatabaseFile(name) {
  const value = await run('readonly', (store) => store.get(name));
  return value ? new Uint8Array(value) : null;
}

export function writeDatabaseFile(name, bytes) {
  return run('readwrite', (store) => store.put(bytes, name));
}
