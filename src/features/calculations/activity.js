// Категория активности по утверждениям об образе жизни.
//
// Пользователь отмечает подходящие утверждения. Мы НЕ складываем баллы или коэффициенты
// за каждый пункт (это завышало бы активность), а оцениваем два независимых признака
// и находим категорию в прозрачной таблице:
//   1. Движение в течение дня (dailyMovement): 0 — в основном сижу, 1 — немного двигаюсь, 2 — много на ногах.
//   2. Тренировки (exercise):                   0 — нет, 1 — регулярно, но умеренно, 2 — часто и интенсивно.
//
// Правила:
//   • Признак = самый сильный выбранный пункт (а не сумма).
//   • Разнообразие: 4+ разных повседневных пункта уровня 1 вместе дают уровень 2
//     по движению; 3+ разных вида умеренных тренировок дают уровень 2 по тренировкам.
//   • «Сижу большую часть дня» вместе с работой «на ногах» противоречат друг другу —
//     такая работа считается как уровень 1.
//   • Если отмечено, что активность сильно меняется или сейчас меньше обычного,
//     итог снижается на одну ступень — честнее недооценить, чем переоценить.
//   • Ничего не отмечено — заметной активности нет: категория «низкая».
//
// Категория показывается пользователю; в расчёте BMR она не участвует.

// Группы — в этом порядке показываются в онбординге
export const ACTIVITY_GROUPS = ['work', 'transport', 'home', 'leisure', 'sport', 'other'];

// Утверждения. id нельзя менять: они хранятся в профиле.
//   dailyMovement / exercise — вклад в признаки (по умолчанию 0)
//   standingJob — работа «на ногах» (для правила о противоречии с сидячим днём)
//   lowers — снижает итог на ступень
export const ACTIVITY_STATEMENTS = [
  // Работа и учёба
  { id: 'mostlySitting', group: 'work' },
  { id: 'remoteWork', group: 'work' },
  { id: 'walkingAtWork', group: 'work', dailyMovement: 1 },
  { id: 'workBreaks', group: 'work', dailyMovement: 1 },
  { id: 'caregiving', group: 'work', dailyMovement: 1 },
  { id: 'activeWork', group: 'work', dailyMovement: 2, standingJob: true },
  { id: 'onFeetJob', group: 'work', dailyMovement: 2, standingJob: true },
  { id: 'physicalJob', group: 'work', dailyMovement: 2, standingJob: true },

  // Передвижение
  { id: 'driveEverywhere', group: 'transport' },
  { id: 'publicTransport', group: 'transport' },
  { id: 'walksRegularly', group: 'transport', dailyMovement: 1 },
  { id: 'walkToWork', group: 'transport', dailyMovement: 1 },
  { id: 'usesStairs', group: 'transport', dailyMovement: 1 },
  { id: 'activeCommute', group: 'transport', dailyMovement: 1 },
  { id: 'walksDog', group: 'transport', dailyMovement: 1 },
  { id: 'steps10k', group: 'transport', dailyMovement: 2 },

  // Дом и быт
  { id: 'housework', group: 'home', dailyMovement: 1 },
  { id: 'cooking', group: 'home', dailyMovement: 1 },
  { id: 'shoppingOnFoot', group: 'home', dailyMovement: 1 },
  { id: 'gardening', group: 'home', dailyMovement: 1 },
  { id: 'diy', group: 'home', dailyMovement: 1 },
  { id: 'playsWithKids', group: 'home', dailyMovement: 1 },
  { id: 'carryingLoads', group: 'home', dailyMovement: 1 },

  // Отдых
  { id: 'screenTime', group: 'leisure' },
  { id: 'activeHobbies', group: 'leisure', dailyMovement: 1 },
  { id: 'weekendHikes', group: 'leisure', exercise: 1 },
  { id: 'cyclingLeisure', group: 'leisure', exercise: 1 },
  { id: 'dancing', group: 'leisure', exercise: 1 },
  { id: 'swimmingCasual', group: 'leisure', exercise: 1 },
  { id: 'activeGames', group: 'leisure', exercise: 1 },
  { id: 'skating', group: 'leisure', exercise: 1 },
  { id: 'morningExercise', group: 'leisure', exercise: 1 },

  // Спорт
  { id: 'yogaStretching', group: 'sport', exercise: 1 },
  { id: 'homeWorkouts', group: 'sport', exercise: 1 },
  { id: 'gym', group: 'sport', exercise: 1 },
  { id: 'running', group: 'sport', exercise: 1 },
  { id: 'swimming', group: 'sport', exercise: 1 },
  { id: 'groupClasses', group: 'sport', exercise: 1 },
  { id: 'teamSports', group: 'sport', exercise: 1 },
  { id: 'martialArts', group: 'sport', exercise: 1 },
  { id: 'sportsRegularly', group: 'sport', exercise: 1 },
  { id: 'trainsOften', group: 'sport', exercise: 2 },
  { id: 'intenseTraining', group: 'sport', exercise: 2 },
  { id: 'competitions', group: 'sport', exercise: 2 },

  // Особенности
  { id: 'variesDaily', group: 'other', lowers: true },
  { id: 'movingLessNow', group: 'other', lowers: true },
];

export const ACTIVITY_STATEMENT_IDS = ACTIVITY_STATEMENTS.map((statement) => statement.id);

// Категории от низшей к высшей
export const ACTIVITY_LEVELS = ['sedentary', 'light', 'moderate', 'active'];

// Сколько разных пунктов уровня 1 «стоят» уровня 2
export const VARIETY_THRESHOLD = { dailyMovement: 4, exercise: 3 };

// Таблица: строка — движение в течение дня, столбец — тренировки
const LEVEL_TABLE = [
  //  нет          умеренно     часто
  ['sedentary', 'light', 'moderate'], // в основном сижу
  ['light', 'moderate', 'active'], // немного двигаюсь
  ['moderate', 'active', 'active'], // много на ногах
];

// Признак по самому сильному пункту с учётом правила разнообразия
function getAxisLevel(statements, axis, contribution) {
  const levels = statements.map(contribution);
  const strongest = Math.max(0, ...levels);
  const moderateCount = levels.filter((level) => level >= 1).length;
  return moderateCount >= VARIETY_THRESHOLD[axis] ? 2 : strongest;
}

// Категория по умолчанию — если ничего не отмечено
export const DEFAULT_ACTIVITY_LEVEL = 'sedentary';

// Возвращает категорию: 'sedentary' | 'light' | 'moderate' | 'active'
export function getActivityLevel(answerIds) {
  const ids = new Set(answerIds ?? []);
  const selected = ACTIVITY_STATEMENTS.filter((statement) => ids.has(statement.id));
  if (selected.length === 0) return DEFAULT_ACTIVITY_LEVEL;

  const sitsMostOfDay = ids.has('mostlySitting');
  const dailyMovement = getAxisLevel(selected, 'dailyMovement', (s) =>
    sitsMostOfDay && s.standingJob ? 1 : (s.dailyMovement ?? 0),
  );
  const exercise = getAxisLevel(selected, 'exercise', (s) => s.exercise ?? 0);

  const level = LEVEL_TABLE[dailyMovement][exercise];

  if (selected.some((statement) => statement.lowers)) {
    return ACTIVITY_LEVELS[Math.max(0, ACTIVITY_LEVELS.indexOf(level) - 1)];
  }
  return level;
}
