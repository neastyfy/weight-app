// Окружности тела в базе. Значения всегда в сантиметрах, даты — ISO в UTC.
// У каждого вида окружности (type) своя история.
// Экраны работают с записями через useMeasurements(), а не напрямую с этим файлом.
import { DUPLICATE_RULE, findDuplicate, prepareBodyMeasurement } from './measurementModel';
import { DuplicateError, NotFoundError, ValidationError } from './errors';

function mapRow(row) {
  return {
    id: row.id,
    type: row.type,
    valueCm: row.value_cm,
    measuredAt: row.measured_at,
    note: row.note,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? null,
  };
}

const ORDER = 'ORDER BY measured_at DESC, id DESC';

// Все измерения (всех видов), новые сверху
export async function listBodyMeasurements(db) {
  const rows = await db.getAllAsync(`SELECT * FROM body_measurements ${ORDER}`);
  return rows.map(mapRow);
}

export async function listBodyMeasurementsByType(db, type) {
  const rows = await db.getAllAsync(`SELECT * FROM body_measurements WHERE type = ? ${ORDER}`, [type]);
  return rows.map(mapRow);
}

export async function getBodyMeasurement(db, id) {
  const row = await db.getFirstAsync('SELECT * FROM body_measurements WHERE id = ?', [id]);
  return row ? mapRow(row) : null;
}

async function assertNotDuplicate(db, entry, excludeId) {
  const time = new Date(entry.measuredAt).getTime();
  const rows = await db.getAllAsync('SELECT * FROM body_measurements WHERE type = ? AND measured_at BETWEEN ? AND ?', [
    entry.type,
    new Date(time - DUPLICATE_RULE.windowMs).toISOString(),
    new Date(time + DUPLICATE_RULE.windowMs).toISOString(),
  ]);
  const duplicate = findDuplicate(
    rows.map(mapRow),
    { value: entry.valueCm, measuredAt: entry.measuredAt, excludeId },
    { valueKey: 'valueCm', tolerance: DUPLICATE_RULE.circumferenceToleranceCm },
  );
  if (duplicate) throw new DuplicateError(duplicate);
}

export async function addBodyMeasurement(db, input, { allowDuplicate = false, now = new Date() } = {}) {
  const { entry, errors } = prepareBodyMeasurement(input, now);
  if (!entry) throw new ValidationError(errors);
  if (!allowDuplicate) await assertNotDuplicate(db, entry, null);

  const result = await db.runAsync(
    'INSERT INTO body_measurements (type, value_cm, measured_at, note, created_at) VALUES (?, ?, ?, ?, ?)',
    [entry.type, entry.valueCm, entry.measuredAt, entry.note, now.toISOString()],
  );
  return getBodyMeasurement(db, result.lastInsertRowId);
}

// Вид окружности у записи не меняется — меняются значение, дата и комментарий
export async function updateBodyMeasurement(db, id, input, { allowDuplicate = false, now = new Date() } = {}) {
  const existing = await getBodyMeasurement(db, id);
  if (!existing) throw new NotFoundError();
  const { entry, errors } = prepareBodyMeasurement({ ...input, type: existing.type }, now);
  if (!entry) throw new ValidationError(errors);
  if (!allowDuplicate) await assertNotDuplicate(db, entry, id);

  await db.runAsync('UPDATE body_measurements SET value_cm = ?, measured_at = ?, note = ?, updated_at = ? WHERE id = ?', [
    entry.valueCm,
    entry.measuredAt,
    entry.note,
    now.toISOString(),
    id,
  ]);
  return getBodyMeasurement(db, id);
}

export async function deleteBodyMeasurement(db, id) {
  const result = await db.runAsync('DELETE FROM body_measurements WHERE id = ?', [id]);
  if (result.changes === 0) throw new NotFoundError();
}
