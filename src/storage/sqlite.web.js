// ТОЛЬКО ДЛЯ БРАУЗЕРА (на iOS — sqlite.js, то есть обычный expo-sqlite).
//
// База — SQLite в памяти страницы (sql.js, WebAssembly). После каждого изменения
// весь файл базы (это десятки килобайт) сохраняется в IndexedDB, при запуске — загружается оттуда.
// Так база работает в любом современном браузере, включая Safari на iPhone,
// и не требует особых заголовков сервера.
//
// Интерфейс тот же, что у expo-sqlite: <SQLiteProvider databaseName onInit useSuspense> и useSQLiteContext().
import initSqlJs from 'sql.js/dist/sql-wasm-browser.js';
import wasmAsset from 'sql.js/dist/sql-wasm-browser.wasm';
import { createContext, use, useContext } from 'react';

import { wrapSqlJsDatabase } from './sqlJsDatabase';
import { readDatabaseFile, writeDatabaseFile } from './webFileStore';

const DatabaseContext = createContext(null);

// Открытие базы — один раз за жизнь страницы (Suspense может вызывать компонент повторно)
const openings = new Map();

// Ошибка «приложение уже открыто в другой вкладке»: две вкладки перезаписывали бы данные друг друга
function busyError() {
  const error = new Error('Database is open in another tab');
  error.name = 'DatabaseBusyError';
  return error;
}

// Держим замок, пока открыта страница (Web Locks есть в Safari 15.4+, без них просто работаем)
function acquireTabLock(name) {
  if (!navigator.locks?.request) return Promise.resolve();
  return new Promise((resolve, reject) => {
    navigator.locks
      .request(`weightapp:${name}`, { ifAvailable: true }, (lock) => {
        if (!lock) {
          reject(busyError());
          return undefined;
        }
        resolve();
        return new Promise(() => {}); // не отпускать до закрытия страницы
      })
      .catch(reject);
  });
}

function wasmUrl() {
  return typeof wasmAsset === 'string' ? wasmAsset : wasmAsset?.uri;
}

async function openDatabase(name, onInit) {
  await acquireTabLock(name);
  // Попросить браузер не удалять данные при нехватке места (молча, если нельзя)
  navigator.storage?.persist?.().catch(() => {});

  const [SQL, saved] = await Promise.all([initSqlJs({ locateFile: wasmUrl }), readDatabaseFile(name)]);
  const raw = new SQL.Database(saved ?? undefined);

  // Сохранения идут строго по очереди, чтобы старый файл не записался поверх нового
  let saving = Promise.resolve();
  const save = () => {
    const bytes = raw.export();
    // export() в sql.js переоткрывает базу — настройки соединения нужно вернуть
    raw.exec('PRAGMA foreign_keys = ON;');
    saving = saving.then(() => writeDatabaseFile(name, bytes)).catch((error) => console.warn('Не удалось сохранить базу', error?.message));
  };

  const db = wrapSqlJsDatabase(raw, { onChange: save });
  await onInit?.(db);
  return db;
}

export function SQLiteProvider({ databaseName, onInit, children }) {
  if (!openings.has(databaseName)) openings.set(databaseName, openDatabase(databaseName, onInit));
  const db = use(openings.get(databaseName));
  return <DatabaseContext value={db}>{children}</DatabaseContext>;
}

export function useSQLiteContext() {
  const db = useContext(DatabaseContext);
  if (!db) throw new Error('useSQLiteContext: нет SQLiteProvider выше по дереву');
  return db;
}
