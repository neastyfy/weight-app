// На iOS база открывается одним приложением, «занятой» она не бывает.
// Логика для браузера — в databaseLock.web.js.
export function isDatabaseBusyError() {
  return false;
}

export function recoverFromBusyDatabase() {
  return false;
}

export function markDatabaseOpened() {}

export const reloadApp = null;
