// Доступ к базе для экранов: SQLiteProvider и useSQLiteContext.
// На iOS — обычный expo-sqlite. В браузере — своя реализация (sqlite.web.js):
// expo-sqlite в Safari не работает (его хранилище OPFS там падает).
export { SQLiteProvider, useSQLiteContext } from 'expo-sqlite';
