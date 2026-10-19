// Текущий возраст.
// Мы храним не дату рождения (лишние персональные данные), а возраст, который
// указал пользователь, и дату, когда он его указал. С каждым прошедшим годом
// возраст увеличивается сам. Погрешность — меньше года, для оценок этого достаточно.

const MS_PER_YEAR = 365.2425 * 24 * 60 * 60 * 1000;

export function getCurrentAge(ageYears, recordedAt, now = new Date()) {
  if (typeof ageYears !== 'number' || !Number.isFinite(ageYears)) return null;
  const recorded = new Date(recordedAt);
  if (Number.isNaN(recorded.getTime())) return ageYears;

  const fullYearsPassed = Math.floor((now.getTime() - recorded.getTime()) / MS_PER_YEAR);
  return ageYears + Math.max(0, fullYearsPassed);
}
