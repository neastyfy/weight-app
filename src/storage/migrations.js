// Миграции базы данных — история изменений структуры таблиц.
//
// Правила:
//   • Уже выпущенные миграции НЕ менять — только добавлять новые в конец списка.
//   • Номер версии = позиция в списке (первая миграция — версия 1).
//   • Текущая версия базы хранится в самой базе (PRAGMA user_version).
// Пример следующей миграции:
//   `ALTER TABLE weight_entries ADD COLUMN source TEXT;`

export const MIGRATIONS = [
  // Версия 1 — настройки, профиль и записи веса
  `
  CREATE TABLE settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );

  CREATE TABLE profile (
    id INTEGER PRIMARY KEY NOT NULL CHECK (id = 1), -- профиль всегда один
    nickname TEXT NOT NULL,
    mascot_id TEXT NOT NULL,
    height_cm REAL NOT NULL,
    age_years INTEGER NOT NULL,
    age_recorded_at TEXT NOT NULL,
    sex TEXT CHECK (sex IN ('female', 'male')),
    weight_unit TEXT NOT NULL CHECK (weight_unit IN ('kg', 'lb')),
    height_unit TEXT NOT NULL CHECK (height_unit IN ('cm', 'in')),
    activity_answers TEXT NOT NULL, -- JSON-массив id утверждений
    target_weight_kg REAL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE weight_entries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    weight_kg REAL NOT NULL CHECK (weight_kg > 0),
    measured_at TEXT NOT NULL,
    note TEXT,
    created_at TEXT NOT NULL
  );

  CREATE INDEX weight_entries_measured_at ON weight_entries (measured_at);
  `,

  // Версия 2 — фото профиля (картинка JPEG в виде data-URI, уменьшенная до ~320 px)
  `
  ALTER TABLE profile ADD COLUMN photo_uri TEXT;
  `,

  // Версия 3 — дата изменения записей веса и окружности тела
  `
  ALTER TABLE weight_entries ADD COLUMN updated_at TEXT;

  CREATE TABLE body_measurements (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL,              -- waist, hips, chest, neck, arm, thigh (см. measurementModel.js)
    value_cm REAL NOT NULL CHECK (value_cm > 0),
    measured_at TEXT NOT NULL,       -- ISO 8601 в UTC
    note TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT
  );

  CREATE INDEX body_measurements_type_measured_at ON body_measurements (type, measured_at);
  `,

  // Версия 4 — тип цели в профиле и история целей.
  // Тип цели у существующего профиля вычисляется по цели и первой записи веса,
  // а сама цель становится первой строкой истории.
  `
  ALTER TABLE profile ADD COLUMN goal_type TEXT; -- lose, gain, maintain или NULL (без цели)

  CREATE TABLE goals (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    goal_type TEXT NOT NULL,         -- lose, gain, maintain, none
    target_weight_kg REAL,           -- NULL, если цели нет
    started_at TEXT NOT NULL,        -- с какого момента действует (ISO в UTC)
    created_at TEXT NOT NULL
  );

  CREATE INDEX goals_started_at ON goals (started_at);

  UPDATE profile SET goal_type = CASE
    WHEN target_weight_kg IS NULL THEN NULL
    WHEN (SELECT weight_kg FROM weight_entries ORDER BY measured_at ASC, id ASC LIMIT 1) IS NULL THEN 'maintain'
    WHEN abs(target_weight_kg - (SELECT weight_kg FROM weight_entries ORDER BY measured_at ASC, id ASC LIMIT 1)) <= 0.5 THEN 'maintain'
    WHEN target_weight_kg < (SELECT weight_kg FROM weight_entries ORDER BY measured_at ASC, id ASC LIMIT 1) THEN 'lose'
    ELSE 'gain'
  END;

  INSERT INTO goals (goal_type, target_weight_kg, started_at, created_at)
    SELECT COALESCE(goal_type, 'none'), target_weight_kg, created_at, created_at FROM profile;
  `,

  // Версия 5 — версии параметров профиля, влияющих на расчёты (рост, возраст, пол, активность).
  // Каждое изменение — новая строка с датой, с которой оно действует; старые не переписываются.
  // Так у любой записи веса можно узнать, какой рост был на её дату (например, для ИМТ).
  // Текущий профиль становится первой версией — действующей с момента его создания.
  `
  CREATE TABLE profile_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    height_cm REAL NOT NULL,
    age_years INTEGER NOT NULL,
    age_recorded_at TEXT NOT NULL,
    sex TEXT CHECK (sex IN ('female', 'male')),
    activity_answers TEXT NOT NULL,  -- JSON-массив id утверждений
    effective_from TEXT NOT NULL,    -- с какого момента действует (ISO в UTC)
    created_at TEXT NOT NULL
  );

  CREATE INDEX profile_versions_effective_from ON profile_versions (effective_from);

  INSERT INTO profile_versions (height_cm, age_years, age_recorded_at, sex, activity_answers, effective_from, created_at)
    SELECT height_cm, age_years, age_recorded_at, sex, activity_answers, created_at, created_at FROM profile;
  `,
];
