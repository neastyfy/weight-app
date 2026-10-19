// Экспорт измерений в CSV для электронных таблиц (тесты: __tests__/csvExport.test.js).
//
// • UTF-8 с меткой BOM — Excel и Numbers правильно открывают кириллицу;
// • разделитель — запятая, строки — CRLF (стандарт RFC 4180);
// • значения с запятыми, кавычками и переносами строк берутся в кавычки, кавычки удваиваются;
// • числа — с точкой и без округления (во внутренних единицах), чтобы не терять точность;
//   рядом — значение в единицах пользователя, округлённое до 0,1;
// • комментарий, начинающийся с = + - @, получает апостроф впереди — чтобы таблица
//   не приняла его за формулу (защита от «CSV-инъекций»).

import { dayKey } from '@/lib/dates';
import { fromCm, fromKg, roundTo } from '@/lib/units';

const BOM = '﻿';

function cell(value) {
  if (value == null) return '';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  let text = String(value);
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  if (/[",\r\n;]/.test(text) || text !== text.trim()) text = `"${text.replace(/"/g, '""')}"`;
  return text;
}

// Таблица → текст CSV. header — подписи столбцов, rows — массивы значений
export function toCsv(header, rows) {
  return BOM + [header, ...rows].map((row) => row.map(cell).join(',')).join('\r\n') + '\r\n';
}

// Местное время «07:30»
function localTime(iso) {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

const byDate = (a, b) => (a.measuredAt < b.measuredAt ? -1 : a.measuredAt > b.measuredAt ? 1 : a.id - b.id);

// Записи веса. labels — подписи столбцов на языке пользователя:
//   { date, time, weightKg, weightInUnit, note, measuredAtUtc }
export function weightEntriesToCsv(entries, { unit, labels }) {
  const header = [labels.date, labels.time, labels.weightKg];
  if (unit !== 'kg') header.push(labels.weightInUnit);
  header.push(labels.note, labels.measuredAtUtc);
  const rows = [...entries].sort(byDate).map((entry) => {
    const row = [dayKey(entry.measuredAt), localTime(entry.measuredAt), entry.weightKg];
    if (unit !== 'kg') row.push(roundTo(fromKg(entry.weightKg, unit), 1));
    row.push(entry.note, entry.measuredAt);
    return row;
  });
  return toCsv(header, rows);
}

// Окружности тела. typeName(id) — название вида на языке пользователя.
//   labels: { date, time, type, typeName, valueCm, valueInUnit, note, measuredAtUtc }
export function bodyMeasurementsToCsv(measurements, { unit, labels, typeName }) {
  const header = [labels.date, labels.time, labels.type, labels.typeName, labels.valueCm];
  if (unit !== 'cm') header.push(labels.valueInUnit);
  header.push(labels.note, labels.measuredAtUtc);
  const rows = [...measurements].sort(byDate).map((m) => {
    const row = [dayKey(m.measuredAt), localTime(m.measuredAt), m.type, typeName(m.type), m.valueCm];
    if (unit !== 'cm') row.push(roundTo(fromCm(m.valueCm, unit), 1));
    row.push(m.note, m.measuredAt);
    return row;
  });
  return toCsv(header, rows);
}
