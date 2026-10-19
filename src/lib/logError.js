// Запись ошибки в диагностический лог БЕЗ личных данных.
// В лог попадают только место ошибки, её тип и текст — не сам объект ошибки:
// у некоторых ошибок внутри лежат данные пользователя (например, DuplicateError хранит
// найденную запись с весом и датой), а логи могут попасть в отчёты о сбоях.
// Пример: logError('Не удалось сохранить цель', error);
export function logError(context, error) {
  const name = error?.name ?? 'Error';
  const message = typeof error?.message === 'string' ? error.message : String(error ?? '');
  console.error(`${context}: ${name}: ${message}`);
}
