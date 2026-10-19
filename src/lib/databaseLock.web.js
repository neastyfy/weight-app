// ТОЛЬКО ДЛЯ БРАУЗЕРА (на iOS — пустой databaseLock.js).
//
// База SQLite в браузере хранится в OPFS, и открыть её может только одна страница сразу.
// При перезагрузке (или обновлении PWA) новая страница иногда стартует раньше, чем закрылась
// старая, — тогда база на миг «занята». Такую ошибку исправляем сами: несколько перезагрузок
// с паузой. Если база занята надолго (приложение открыто во второй вкладке) — честный экран.

const ATTEMPTS_KEY = 'weightapp.dbLockAttempts';
const MAX_ATTEMPTS = 5;

// Ошибка «файл базы уже открыт другой страницей»?
export function isDatabaseBusyError(error) {
  const text = `${error?.name ?? ''} ${error?.message ?? ''}`;
  return /Access Handle|createSyncAccessHandle|NoModificationAllowedError/i.test(text);
}

function readAttempts() {
  try {
    return Number(sessionStorage.getItem(ATTEMPTS_KEY) ?? 0);
  } catch {
    return MAX_ATTEMPTS;
  }
}

// Попробовать восстановиться: true — страница сейчас перезагрузится сама
export function recoverFromBusyDatabase() {
  const attempts = readAttempts();
  if (attempts >= MAX_ATTEMPTS) return false;
  try {
    sessionStorage.setItem(ATTEMPTS_KEY, String(attempts + 1));
  } catch {
    return false;
  }
  setTimeout(() => window.location.reload(), 400 * (attempts + 1));
  return true;
}

// База открылась — сбросить счётчик попыток
export function markDatabaseOpened() {
  try {
    sessionStorage.removeItem(ATTEMPTS_KEY);
  } catch {
    // нет доступа к sessionStorage — не страшно
  }
}

// «Повторить» в браузере: базу можно открыть заново только перезагрузкой страницы
export function reloadApp() {
  markDatabaseOpened();
  window.location.reload();
}

// Может ли браузер запустить базу: нужна «изолированная» страница (заголовки COOP/COEP)
// и SharedArrayBuffer. Если нет — вместо бесконечной загрузки покажем понятный экран.
export function isDatabaseSupported() {
  return typeof window !== 'undefined' && window.crossOriginIsolated === true && typeof SharedArrayBuffer !== 'undefined';
}
