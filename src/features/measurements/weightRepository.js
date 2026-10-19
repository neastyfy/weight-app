// Записи веса в базе. Вес всегда в килограммах, даты — ISO в UTC.
// Экраны работают с записями через useMeasurements(), а не напрямую с этим файлом.
//
// Ошибки, которые понимает интерфейс:
//   ValidationError — данные не прошли проверку (error.errors — { поле: { key, params } })
//   DuplicateError  — похоже на случайный повтор (error.duplicate — найденная запись)
//   NotFoundError   — записи с таким id нет
import { DUPLICATE_RULE, findDuplicate, prepareWeightEntry } from './measurementModel';
import { DuplicateError, NotFoundError, ValidationError } from './errors';

function mapRow(row) {
  return {
    id: row.id,
    weightKg: row.weight_kg,
    measuredAt: row.measured_at,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null,
  };
}

const ORDER = 'ORDER BY measured_at DESC, id DESC';

// Все записи, новые сверху
export async function listWeightEntries(db) {
  const rows = await db.getAllAsync(`SELECT * FROM weight_entries ${ORDER}`);
  return rows.map(mapRow);
}

export async function getWeightEntry(db, id) {
  const row = await db.getFirstAsync('SELECT * FROM weight_entries WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

// Последняя по дате измерения запись или null
export async function getLatestWeightEntry(db) {
  const row = await db.getFirstAsync(`SELECT * FROM weight_entries ${ORDER} LIMIT 1`);
  return row ? mapRow(row) : null;
}

// Записи рядом по времени — для проверки дублей
async function listNearby(db, measuredAt) {
  const time = new Date(measuredAt).getTime();
  const from = new Date(time - DUPLICATE_RULE.windowMs).toISOString();
  const to = new Date(time + DUPLICATE_RULE.windowMs).toISOString();
  const rows = await db.getAllAsync('SELECT * FROM weight_entries WHERE measured_at BETWEEN ? AND ?', [from, to]);
  return rows.map(mapRow);
}

async function assertNotDuplicate(db, entry, excludeId) {
  const duplicate = findDuplicate(
    await listNearby(db, entry.measuredAt),
    { value: entry.weightKg, measuredAt: entry.measuredAt, excludeId },
    { valueKey: 'weightKg', tolerance: DUPLICATE_RULE.weightToleranceKg },
  );
  if (duplicate) throw new DuplicateError(duplicate);
}

// Добавляет запись. allowDuplicate — пользователь подтвердил, что это не случайный повтор.
// Возвращает сохранённую запись.
export async function addWeightEntry(db, input, { allowDuplicate = false, now = new Date() } = {}) {
  const { entry, errors } = prepareWeightEntry(input, now);
  if (!entry) throw new ValidationError(errors);
  if (!allowDuplicate) await assertNotDuplicate(db, entry, null);

  const createdAt = input.createdAt ?? now.toISOString();
  const result = await db.runAsync(
    'INSERT INTO weight_entries (weight_kg, measured_at, note, created_at) VALUES (?, ?, ?, ?)',
    [entry.weightKg, entry.measuredAt, entry.note, createdAt],
  );
  return getWeightEntry(db, result.lastInsertRowId);
}

export async function updateWeightEntry(db, id, input, { allowDuplicate = false, now = new Date() } = {}) {
  const existing = await getWeightEntry(db, id);
  if (!existing) throw new NotFoundError();
  const { entry, errors } = prepareWeightEntry(input, now);
  if (!entry) throw new ValidationError(errors);
  if (!allowDuplicate) await assertNotDuplicate(db, entry, id);

  await db.runAsync('UPDATE weight_entries SET weight_kg = ?, measured_at = ?, note = ?, updated_at = ? WHERE id = ?', [
    entry.weightKg,
    entry.measuredAt,
    entry.note,
    now.toISOString(),
    id,
  ]);
  return getWeightEntry(db, id);
}

export async function deleteWeightEntry(db, id) {
  const result = await db.runAsync('DELETE FROM weight_entries WHERE id = ?', [id]);
  if (result.changes === 0) throw new NotFoundError();
}
