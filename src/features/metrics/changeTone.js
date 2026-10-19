// Цвет записей в истории — в зависимости от цели, действовавшей в момент записи.
//
// Вес (getWeightEntryTone):
//   Похудение (lose): снижение относительно прошлой записи — хорошо (success), рост — красный (error).
//   Набор (gain): наоборот.
//   Удержание (maintain): важно не изменение, а отклонение от целевого веса:
//     на цели (меньше 0,05 кг) — success, в пределах ±3 кг — caution (жёлтый), дальше — error.
//   Без цели (none / null) — без цвета.
//
// Окружности (getChangeTone): похудение/набор — как у веса; удержание — без изменений success,
// иначе caution (у окружностей нет своей цели, поэтому без красного).

export const NEGLIGIBLE_CHANGE = 0.05; // меньше — считаем «без изменений» / «на цели»
export const MAINTAIN_ZONE_KG = 3; // допустимый зазор при удержании веса

// Тон по изменению относительно прошлой записи: 'success' | 'caution' | 'error' | null
export function getChangeTone(change, goalType) {
  if (change == null || goalType == null || goalType === 'none') return null;
  const unchanged = Math.abs(change) < NEGLIGIBLE_CHANGE;
  if (goalType === 'maintain') return unchanged ? 'success' : 'caution';
  if (unchanged) return null;
  const towardsGoal = goalType === 'lose' ? change < 0 : change > 0;
  return towardsGoal ? 'success' : 'error';
}

// Тон отклонения от целевого веса при удержании: 'success' | 'caution' | 'error'
export function getMaintainTone(weightKg, targetWeightKg) {
  const deviation = Math.abs(weightKg - targetWeightKg);
  if (deviation < NEGLIGIBLE_CHANGE) return 'success';
  return deviation <= MAINTAIN_ZONE_KG ? 'caution' : 'error';
}

// Тон записи веса. goal — цель на момент записи ({ goalType, targetWeightKg }) или null.
export function getWeightEntryTone({ change, weightKg, goal }) {
  if (!goal || goal.goalType === 'none') return null;
  if (goal.goalType === 'maintain' && goal.targetWeightKg != null) return getMaintainTone(weightKg, goal.targetWeightKg);
  return getChangeTone(change, goal.goalType);
}
