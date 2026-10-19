// Логика Главной без интерфейса (тесты: __tests__/homeModel.test.js).
import { getWeightEntryTone } from '@/features/metrics/changeTone';
import { addDays, dayKey, isSameDay, startOfDay } from '@/lib/dates';

// Сводка по весу. entries — записи, новые сверху (как в useMeasurements).
//   latest — последняя запись, previous — предыдущая, first — самая ранняя;
//   changeFromPrevious / changeFromFirst — разница в кг или null, если сравнить не с чем.
export function getWeightSummary(entries) {
  const latest = entries[0] ?? null;
  const previous = entries[1] ?? null;
  const first = entries.length > 1 ? entries[entries.length - 1] : null;
  return {
    latest,
    previous,
    first,
    changeFromPrevious: previous ? latest.weightKg - previous.weightKg : null,
    changeFromFirst: first ? latest.weightKg - first.weightKg : null,
  };
}

// Короткая строка под приветствием (как «Отличный прогресс! 💪» в референсе) — ключ перевода home.status.*:
//   'reached'  — цель достигнута;
//   'progress' — свежая запись (сегодня или вчера) сдвинула вес к цели;
//   'logged'   — сегодня уже взвешивались;
//   'evening'  — вечер (фон «маскот спит»), а записи сегодня нет;
//   'reminder' — мягкое напоминание взвеситься.
// Никогда не упрекает: рост веса или пропуски не дают «плохих» сообщений.
export function getGreetingStatus({ summary, goal, goalProgress, timeOfDay, now = new Date() }) {
  if (goalProgress === 'reached' || goalProgress === 'exceeded') return 'reached';
  const { latest } = summary;
  if (latest && new Date(latest.measuredAt) >= startOfDay(addDays(now, -1))) {
    const tone = getWeightEntryTone({ change: summary.changeFromPrevious, weightKg: latest.weightKg, goal });
    if (tone === 'success') return 'progress';
  }
  if (latest && isSameDay(latest.measuredAt, now)) return 'logged';
  return timeOfDay === 'night' ? 'evening' : 'reminder';
}

// Номер мотивирующей фразы: случайный, но не такой, как в прошлый раз.
// random — функция от 0 до 1 (в тестах подставляется своя)
export function pickPhraseIndex(count, previousIndex, random = Math.random) {
  if (count <= 1) return 0;
  const index = Math.floor(random() * (count - 1));
  // пропускаем прошлую фразу: всё, что не меньше неё, сдвигаем на один
  return previousIndex != null && previousIndex >= 0 && index >= previousIndex ? index + 1 : index;
}

// Сколько дней показывать в полоске стрика
export const STREAK_WEEK_DAYS = 7;

// Засчитывается ли запись в стрик: только если внесена в тот же день, на который датирована.
// Запись задним числом сохраняется и видна в истории, но пропущенный день «закрыть» ей нельзя.
export function countsForStreak(entry) {
  return entry.createdAt != null && dayKey(entry.createdAt) === dayKey(entry.measuredAt);
}

// Стрик — дни подряд с записью веса, внесённой в тот же день (по местному календарю).
//   current — текущая серия. Если сегодня ещё не взвешивались, серия не обрывается:
//             считается до вчерашнего дня включительно (день ещё не закончился);
//   best — самая длинная серия за всё время;
//   weighedToday — есть ли засчитанная запись сегодня;
//   week — последние 7 дней по порядку (последний — сегодня): [{ date, state }], где state:
//     'done'      — день засчитан,
//     'missed'    — пропущен (записи нет или она добавлена задним числом),
//     'pending'   — сегодня, записи пока нет (день не закончился — не пропуск),
//     'beforeStart' — день до создания профиля (не учитывается).
// profileCreatedAt — дата создания профиля (ISO); без неё дни до начала не выделяются.
export function getStreak(entries, { now = new Date(), profileCreatedAt = null } = {}) {
  const days = new Set(entries.filter(countsForStreak).map((entry) => dayKey(entry.measuredAt)));
  const today = startOfDay(now);
  const weighedToday = days.has(dayKey(today));
  const firstDay = profileCreatedAt ? startOfDay(profileCreatedAt) : null;

  let current = 0;
  for (let day = weighedToday ? today : addDays(today, -1); days.has(dayKey(day)); day = addDays(day, -1)) {
    current += 1;
  }

  // рекорд: идём по засчитанным дням по порядку и считаем подряд идущие
  let best = 0;
  let run = 0;
  let previous = null;
  for (const key of [...days].sort()) {
    const [year, month, date] = key.split('-').map(Number);
    const day = new Date(year, month - 1, date);
    run = previous && dayKey(addDays(previous, 1)) === key ? run + 1 : 1;
    best = Math.max(best, run);
    previous = day;
  }

  const week = [];
  for (let i = STREAK_WEEK_DAYS - 1; i >= 0; i -= 1) {
    const date = addDays(today, -i);
    let state;
    if (days.has(dayKey(date))) state = 'done';
    else if (firstDay && date < firstDay) state = 'beforeStart';
    else if (i === 0) state = 'pending';
    else state = 'missed';
    week.push({ date, state });
  }

  return { current, best, weighedToday, week };
}
