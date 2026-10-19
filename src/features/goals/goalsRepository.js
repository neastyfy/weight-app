// История целей в базе. Текущая цель также хранится в профиле (target_weight_kg, goal_type),
// чтобы её было удобно читать вместе с профилем.
// Экраны работают с целями через useProfile(), а не напрямую с этим файлом.
import { GOAL_TYPES } from './goalModel';

function mapRow(row) {
  return {
    id: row.id,
    goalType: row.goal_type,
    targetWeightKg: row.target_weight_kg,
    startedAt: row.started_at,
    createdAt: row.created_at,
  };
}

// Все цели по порядку начала
export async function listGoals(db) {
  const rows = await db.getAllAsync('SELECT * FROM goals ORDER BY started_at ASC, id ASC');
  return rows.map(mapRow);
}

// Добавить строку истории (используется и при создании профиля — внутри его транзакции)
export async function insertGoal(db, { goalType, targetWeightKg, startedAt }) {
  if (!GOAL_TYPES.includes(goalType)) throw new Error(`Неизвестный тип цели: ${goalType}`);
  await db.runAsync('INSERT INTO goals (goal_type, target_weight_kg, started_at, created_at) VALUES (?, ?, ?, ?)', [
    goalType,
    goalType === 'none' ? null : targetWeightKg,
    startedAt,
    new Date().toISOString(),
  ]);
}

// Новая цель: строка в истории + текущая цель в профиле — одной транзакцией
export async function setGoal(db, { goalType, targetWeightKg, startedAt = new Date().toISOString() }) {
  await db.withTransactionAsync(async () => {
    await insertGoal(db, { goalType, targetWeightKg, startedAt });
    await db.runAsync('UPDATE profile SET target_weight_kg = ?, goal_type = ?, updated_at = ? WHERE id = 1', [
      goalType === 'none' ? null : targetWeightKg,
      goalType === 'none' ? null : goalType,
      startedAt,
    ]);
  });
}
