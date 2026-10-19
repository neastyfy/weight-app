// Подготовка истории к показу: группировка по дням и изменения между соседними записями.
import { addDays, dayKey, isSameDay } from '@/lib/dates';
import { capitalizeFirst, getLocale } from '@/lib/format';

// Записи (новые сверху) → [{ key, date, entries }] по местным дням, новые дни сверху
export function groupByDay(entries) {
  const groups = [];
  for (const entry of entries) {
    const key = dayKey(entry.measuredAt);
    const last = groups[groups.length - 1];
    if (last && last.key === key) last.entries.push(entry);
    else groups.push({ key, date: new Date(entry.measuredAt), entries: [entry] });
  }
  return groups;
}

// Изменение каждой записи относительно предыдущего по времени измерения.
// entries — новые сверху; возвращает Map: id → разница (или нет значения для самой ранней)
export function changesFromPrevious(entries, valueKey) {
  const changes = new Map();
  for (let i = 0; i < entries.length - 1; i += 1) {
    changes.set(entries[i].id, entries[i][valueKey] - entries[i + 1][valueKey]);
  }
  return changes;
}

// Заголовок дня: «Сегодня», «Вчера» или «пн, 13 октября 2026 г.»
export function dayTitle(date, language, t, now = new Date()) {
  if (isSameDay(date, now)) return t('common.today');
  if (isSameDay(date, addDays(now, -1))) return t('common.yesterday');
  const title = new Intl.DateTimeFormat(getLocale(language), {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  }).format(date);
  return capitalizeFirst(title);
}
