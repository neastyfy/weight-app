// Цели: тип цели, достижение и история.
// Только чистые функции (тесты: __tests__/goalModel.test.js).
//
// Типы целей:
//   lose     — похудение (цель ниже текущего веса)
//   gain     — набор веса (цель выше текущего веса)
//   maintain — удержание веса (цель почти равна текущему весу)
//   none     — без цели
//
// История целей хранится в таблице goals: каждая смена цели — новая строка с датой начала.
// Так у любой записи веса можно узнать, какая цель действовала в момент измерения.

export const GOAL_TYPES = ['lose', 'gain', 'maintain', 'none'];

// Цель в пределах 0,5 кг от текущего веса считается удержанием
export const MAINTAIN_TOLERANCE_KG = 0.5;
// Точность «ровно на цели»: меньше 0,05 кг — цель достигнута, больше — перевыполнена
export const GOAL_PRECISION_KG = 0.05;

// Тип цели по целевому и текущему весу (определяется при постановке цели)
export function determineGoalType(targetWeightKg, currentWeightKg) {
  if (targetWeightKg == null) return 'none';
  if (currentWeightKg == null) return 'maintain';
  const difference = targetWeightKg - currentWeightKg;
  if (Math.abs(difference) <= MAINTAIN_TOLERANCE_KG) return 'maintain';
  return difference < 0 ? 'lose' : 'gain';
}

// Состояние цели: 'inProgress' | 'reached' | 'exceeded' | null (удержание, нет цели или веса)
export function getGoalProgress({ goalType, targetWeightKg, currentWeightKg }) {
  if (currentWeightKg == null || targetWeightKg == null) return null;
  if (goalType !== 'lose' && goalType !== 'gain') return null;
  const beyond = goalType === 'lose' ? targetWeightKg - currentWeightKg : currentWeightKg - targetWeightKg;
  if (Math.abs(beyond) < GOAL_PRECISION_KG) return 'reached';
  return beyond > 0 ? 'exceeded' : 'inProgress';
}

// Цель, действовавшая на дату измерения.
// goals — список целей (в любом порядке), date — ISO-строка.
// Измерения раньше первой цели относятся к первой цели (она ставится при онбординге).
export function findGoalAt(goals, date) {
  if (!goals?.length) return null;
  const sorted = [...goals].sort((a, b) => (a.startedAt === b.startedAt ? a.id - b.id : a.startedAt < b.startedAt ? -1 : 1));
  let active = sorted[0];
  for (const goal of sorted) {
    if (goal.startedAt <= date) active = goal;
    else break;
  }
  return active;
}

// Относится ли запись к цели: датирована не раньше постановки цели
// или внесена после постановки (в том числе задним числом).
// Старые записи, внесённые до постановки цели, к ней не относятся.
export function belongsToGoal(entry, goal) {
  return entry.measuredAt >= goal.startedAt || (entry.createdAt != null && entry.createdAt >= goal.startedAt);
}

// Стартовый вес цели — самая ранняя по дате запись цели (см. belongsToGoal).
// Пока таких записей нет, стартом считается последний вес до цели — прогресс тогда 0.
// entries — в любом порядке.
export function getGoalStartWeight(goal, entries) {
  if (!goal || !entries?.length) return null;
  let firstOfGoal = null;
  let lastBefore = null;
  for (const entry of entries) {
    if (belongsToGoal(entry, goal)) {
      if (!firstOfGoal || entry.measuredAt < firstOfGoal.measuredAt) firstOfGoal = entry;
    } else if (!lastBefore || entry.measuredAt > lastBefore.measuredAt) {
      lastBefore = entry;
    }
  }
  return (firstOfGoal ?? lastBefore)?.weightKg ?? null;
}

// Путь к цели (похудение или набор), все значения в кг:
//   startWeightKg — вес на старте цели,
//   changeKg — изменение веса с начала цели (со знаком: −2 — похудели на 2 кг),
//   doneKg — сколько пройдено в сторону цели (меньше нуля — вес ушёл в обратную сторону),
//   remainingKg — сколько осталось (0, если цель достигнута),
//   fraction — доля пути от 0 до 1 или null, если долю посчитать честно нельзя
//              (старт уже был на цели или по другую сторону от неё — например, после смены направления).
// Никогда не возвращает отрицательную или бесконечную долю.
export function getGoalJourney({ goal, entries, currentWeightKg }) {
  if (!goal || (goal.goalType !== 'lose' && goal.goalType !== 'gain')) return null;
  if (goal.targetWeightKg == null || currentWeightKg == null) return null;
  const startWeightKg = getGoalStartWeight(goal, entries);
  if (startWeightKg == null) return null;

  // направление: −1 — вниз (похудение), +1 — вверх (набор)
  const direction = goal.goalType === 'lose' ? -1 : 1;
  const totalKg = (goal.targetWeightKg - startWeightKg) * direction;
  const doneKg = (currentWeightKg - startWeightKg) * direction;
  const remainingKg = Math.max(0, (goal.targetWeightKg - currentWeightKg) * direction);

  let fraction = null;
  if (totalKg >= GOAL_PRECISION_KG) {
    fraction = remainingKg < GOAL_PRECISION_KG ? 1 : Math.min(1, Math.max(0, doneKg / totalKg));
  }
  return { startWeightKg, changeKg: currentWeightKg - startWeightKg, doneKg, remainingKg, fraction };
}

// Этапы пути к цели: четверть, половина, три четверти и вся цель.
export const GOAL_MILESTONES = [0.25, 0.5, 0.75, 1];

// Этапы для цели похудения или набора: [{ fraction, weightKg, reachedAt, reachedWeightKg }].
//   weightKg — вес, при котором этап пройден; reachedAt — дата ПЕРВОЙ записи цели,
//   на которой он пройден (null — ещё впереди). Считается только по реальным записям цели.
// null — этапы посчитать нельзя (удержание, нет цели или записей, старт уже за целью).
export function getGoalMilestones(goal, entries) {
  if (!goal || (goal.goalType !== 'lose' && goal.goalType !== 'gain') || goal.targetWeightKg == null) return null;
  const startWeightKg = getGoalStartWeight(goal, entries);
  if (startWeightKg == null) return null;
  const direction = goal.goalType === 'lose' ? -1 : 1;
  const totalKg = (goal.targetWeightKg - startWeightKg) * direction;
  if (totalKg < GOAL_PRECISION_KG) return null;

  const goalEntries = entries
    .filter((entry) => belongsToGoal(entry, goal))
    .sort((a, b) => (a.measuredAt < b.measuredAt ? -1 : a.measuredAt > b.measuredAt ? 1 : 0));

  return GOAL_MILESTONES.map((fraction) => {
    const needKg = totalKg * fraction;
    const reached = goalEntries.find((entry) => (entry.weightKg - startWeightKg) * direction >= needKg - GOAL_PRECISION_KG);
    return {
      fraction,
      weightKg: startWeightKg + direction * needKg,
      reachedAt: reached?.measuredAt ?? null,
      reachedWeightKg: reached?.weightKg ?? null,
    };
  });
}

// История целей с итогами, новые сверху: [{ ...goal, endedAt, status }].
//   endedAt — когда цель сменили (начало следующей) или null для текущей;
//   status: 'active' — текущая, 'none' — период «без цели» (цель убрали),
//           'reached' — в её период была запись на цели или дальше (похудение / набор),
//           'replaced' — цель сменили, не достигнув (это нормально — планы меняются).
// «Достигнута» ставится только по реальным записям за период цели.
export function getGoalHistory(goals, entries) {
  const sorted = [...(goals ?? [])].sort((a, b) => (a.startedAt === b.startedAt ? a.id - b.id : a.startedAt < b.startedAt ? -1 : 1));
  const history = sorted.map((goal, index) => {
    const endedAt = sorted[index + 1]?.startedAt ?? null;
    let status;
    if (goal.goalType === 'none') status = 'none';
    else {
      const inPeriod = (entries ?? []).filter((entry) => entry.measuredAt >= goal.startedAt && (endedAt == null || entry.measuredAt < endedAt));
      const reached = inPeriod.some((entry) => {
        const progress = getGoalProgress({ goalType: goal.goalType, targetWeightKg: goal.targetWeightKg, currentWeightKg: entry.weightKg });
        return progress === 'reached' || progress === 'exceeded';
      });
      status = reached ? 'reached' : endedAt == null ? 'active' : 'replaced';
    }
    return { ...goal, endedAt, status };
  });
  return history.reverse();
}
