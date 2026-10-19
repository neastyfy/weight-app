// Даты и время.
//
// ЕДИНЫЙ ФОРМАТ ХРАНЕНИЯ: строка ISO 8601 в UTC — «2026-10-19T07:30:00.000Z»
// (всегда получается через toIsoString). Такие строки одинаковой длины,
// поэтому их можно сравнивать и сортировать как текст — и в коде, и в SQL.
// Показываем даты всегда в местном времени устройства.

// Дата → строка для хранения
export function toIsoString(date) {
  return new Date(date).toISOString();
}

export function isValidDate(value) {
  const date = value instanceof Date ? value : new Date(value);
  return !Number.isNaN(date.getTime());
}

// Местная дата (год, месяц, день) + местное время (часы, минуты) → Date
export function combineDateAndTime(day, hours, minutes) {
  return new Date(day.getFullYear(), day.getMonth(), day.getDate(), hours, minutes, 0, 0);
}

// Начало местного дня
export function startOfDay(date) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function isSameDay(a, b) {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function addDays(date, days) {
  const d = new Date(date);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days, d.getHours(), d.getMinutes());
}

// Ключ местного дня «2026-10-19» — для группировки записей по дням
export function dayKey(date) {
  const d = new Date(date);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Сортировка записей по дате измерения: новые сверху.
// При одинаковой дате — более поздняя по созданию (больший id) выше.
export function sortByMeasuredAtDesc(entries) {
  return [...entries].sort((a, b) => {
    if (a.measuredAt !== b.measuredAt) return a.measuredAt < b.measuredAt ? 1 : -1;
    return (b.id ?? 0) - (a.id ?? 0);
  });
}

// Недели месяца для календаря: массив недель по 7 ячеек (Date или null), неделя с понедельника
export function getMonthGrid(year, month) {
  const first = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const offset = (first.getDay() + 6) % 7; // понедельник = 0
  const cells = [];
  for (let i = 0; i < offset; i += 1) cells.push(null);
  for (let day = 1; day <= daysInMonth; day += 1) cells.push(new Date(year, month, day));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}
