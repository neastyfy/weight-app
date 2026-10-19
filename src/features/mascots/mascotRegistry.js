// Реестр маскотов — единственное место, где перечислены персонажи и их картинки.
//
// Как добавить нового маскота:
//   1. Положите картинки с прозрачным фоном в assets/mascots/<id>/alpha/<состояние>.png
//   2. Добавьте запись в MASCOTS ниже (обязательно хотя бы состояние idle).
//      Если персонаж на какой-то картинке стоит не по центру — добавьте поправку в offsets
//      (доля размера: 0.05 — сдвинуть влево на 5 %).
//   3. Фоны Главной — 4 картинки в assets/mascots/<id>/backgrounds/optimized/:
//      day_light.jpg, day_dark.jpg (пикник днём) и night_light.jpg, night_dark.jpg (маскот спит).
//      Сохраняйте их в JPEG (качество ~85 %): PNG в 10 раз тяжелее и раздувает приложение.
//      Оригиналы можно хранить рядом, в backgrounds/ — в приложение попадают только optimized.
//   4. Добавьте имя и роль в файлы переводов: src/i18n/translations/*.js → mascots.<id>
// Остальной код менять не нужно.

// Состояния маскота
export const MASCOT_STATES = [
  'idle',
  'happy',
  'greet',
  'sad',
  'sleep',
  'question',
  'height',
  'weight',
  'writing',
  'goal',
  'watching_down',
  'celebrate',
];
// idle — спокойный (обычное состояние)
// happy — радуется успеху
// greet — приветствует
// sad — сочувствует и поддерживает. НЕ использовать как наказание
//       за набор веса или пропуски измерений.
// sleep — спит (например, ночью или в тёмной теме)
// question — задаёт вопрос (шаг «Как к тебе обращаться?»)
// height — с линейкой роста, weight — с весами, writing — записывает (возраст)
// goal — с планшетом цели, watching_down — заглядывает вниз (итоги онбординга)
// celebrate — празднует (всплывающее поздравление с достижением цели)
// Если у маскота нет картинки для состояния, показывается idle.

export const DEFAULT_MASCOT_STATE = 'idle';
export const DEFAULT_MASCOT_ID = 'peach';

export const MASCOTS = {
  peach: {
    id: 'peach',
    images: {
      idle: require('@assets/mascots/peach/alpha/idle.png'),
      happy: require('@assets/mascots/peach/alpha/happy.png'),
      greet: require('@assets/mascots/peach/alpha/greet.png'),
      sad: require('@assets/mascots/peach/alpha/sad.png'),
      sleep: require('@assets/mascots/peach/alpha/sleep.png'),
      question: require('@assets/mascots/peach/alpha/question.png'),
      height: require('@assets/mascots/peach/alpha/height.png'),
      weight: require('@assets/mascots/peach/alpha/weight.png'),
      writing: require('@assets/mascots/peach/alpha/writing.png'),
      goal: require('@assets/mascots/peach/alpha/goal.png'),
      watching_down: require('@assets/mascots/peach/alpha/watching_down.png'),
      celebrate: require('@assets/mascots/peach/alpha/celebrate.png'),
    },
    // Поправки центровки: на этих картинках реквизит справа (весы, блокнот, планшет),
    // и персонаж выглядит смещённым вправо. Доля размера картинки, подобрано по скриншотам.
    offsets: { weight: 0.05, writing: 0.03, goal: 0.03 },
    // Фоны Главной (сжатые копии из backgrounds/optimized): day — пикник, night — маскот спит
    backgrounds: {
      day: {
        light: require('@assets/mascots/peach/backgrounds/optimized/day_light.jpg'),
        dark: require('@assets/mascots/peach/backgrounds/optimized/day_dark.jpg'),
      },
      night: {
        light: require('@assets/mascots/peach/backgrounds/optimized/night_light.jpg'),
        dark: require('@assets/mascots/peach/backgrounds/optimized/night_dark.jpg'),
      },
    },
  },
  snowflake: {
    id: 'snowflake',
    images: {
      idle: require('@assets/mascots/snowflake/alpha/idle.png'),
      happy: require('@assets/mascots/snowflake/alpha/happy.png'),
      greet: require('@assets/mascots/snowflake/alpha/greet.png'),
      sad: require('@assets/mascots/snowflake/alpha/sad.png'),
      sleep: require('@assets/mascots/snowflake/alpha/sleep.png'),
      question: require('@assets/mascots/snowflake/alpha/question.png'),
      height: require('@assets/mascots/snowflake/alpha/height.png'),
      weight: require('@assets/mascots/snowflake/alpha/weight.png'),
      writing: require('@assets/mascots/snowflake/alpha/writing.png'),
      goal: require('@assets/mascots/snowflake/alpha/goal.png'),
      watching_down: require('@assets/mascots/snowflake/alpha/watching_down.png'),
      celebrate: require('@assets/mascots/snowflake/alpha/celebrate.png'),
    },
    offsets: { weight: 0.04, writing: 0.03, goal: 0.04 },
    // Фоны Главной (сжатые копии из backgrounds/optimized): day — пикник, night — маскот спит
    backgrounds: {
      day: {
        light: require('@assets/mascots/snowflake/backgrounds/optimized/day_light.jpg'),
        dark: require('@assets/mascots/snowflake/backgrounds/optimized/day_dark.jpg'),
      },
      night: {
        light: require('@assets/mascots/snowflake/backgrounds/optimized/night_light.jpg'),
        dark: require('@assets/mascots/snowflake/backgrounds/optimized/night_dark.jpg'),
      },
    },
  },
};

export const MASCOT_IDS = Object.keys(MASCOTS);

// Возвращает маскота по id; неизвестный id → маскот по умолчанию.
export function getMascot(mascotId) {
  return MASCOTS[mascotId] ?? MASCOTS[DEFAULT_MASCOT_ID];
}

// Поправка центровки картинки (доля размера; положительная — сдвинуть влево)
export function getMascotOffset(mascotId, state) {
  return getMascot(mascotId).offsets?.[state] ?? 0;
}

// Возвращает картинку для состояния; если её нет → картинка idle.
export function getMascotImage(mascotId, state) {
  const mascot = getMascot(mascotId);
  return mascot.images[state] ?? mascot.images[DEFAULT_MASCOT_STATE];
}

// Время суток для фона Главной: 'day' (пикник) с 06:00 до 19:59, иначе 'night' (маскот спит)
export const DAY_START_HOUR = 6;
export const NIGHT_START_HOUR = 20;
export function getTimeOfDay(date = new Date()) {
  const hour = date.getHours();
  return hour >= DAY_START_HOUR && hour < NIGHT_START_HOUR ? 'day' : 'night';
}

// Фон Главной: timeOfDay — 'day' | 'night', scheme — 'light' | 'dark' (тема приложения)
export function getMascotBackground(mascotId, timeOfDay, scheme) {
  return getMascot(mascotId).backgrounds[timeOfDay][scheme];
}
