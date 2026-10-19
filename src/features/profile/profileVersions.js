// Версии параметров профиля, влияющих на расчёты (тесты: __tests__/profileVersions.test.js).
//
// Зачем: если пользователь изменил рост, старые записи веса не должны пересчитываться
// так, будто новый рост был всегда. Поэтому каждое изменение сохраняется как версия
// с датой, с которой оно действует (таблица profile_versions), а старые версии не меняются.
//
// Версионируются: рост, возраст (с датой, когда он указан), пол, активность.
// НЕ версионируются (на расчёты не влияют): имя, маскот, фото, единицы измерения.
//
// Версия: { id, heightCm, ageYears, ageRecordedAt, sex, activityAnswers, effectiveFrom, createdAt }

export const VERSIONED_FIELDS = ['heightCm', 'ageYears', 'ageRecordedAt', 'sex', 'activityAnswers'];

// Параметры версии из профиля (или из профиля с изменениями)
export function pickVersionedParams(profile) {
  return {
    heightCm: profile.heightCm,
    ageYears: profile.ageYears,
    ageRecordedAt: profile.ageRecordedAt,
    sex: profile.sex ?? null,
    activityAnswers: [...(profile.activityAnswers ?? [])],
  };
}

// Изменилось ли что-то, влияющее на расчёты
export function versionedParamsChanged(before, after) {
  const a = pickVersionedParams(before);
  const b = pickVersionedParams(after);
  return (
    a.heightCm !== b.heightCm ||
    a.ageYears !== b.ageYears ||
    a.sex !== b.sex ||
    JSON.stringify([...a.activityAnswers].sort()) !== JSON.stringify([...b.activityAnswers].sort())
  );
}

// Версия, действовавшая на дату (ISO-строка): последняя с effectiveFrom ≤ date.
// null — дата раньше первой версии: тогда параметры на эту дату неизвестны.
// versions — в любом порядке.
export function findProfileVersionAt(versions, date) {
  let found = null;
  for (const version of versions ?? []) {
    if (version.effectiveFrom <= date && (!found || version.effectiveFrom >= found.effectiveFrom)) found = version;
  }
  return found;
}

// Самая ранняя версия (или null)
export function getFirstProfileVersion(versions) {
  let first = null;
  for (const version of versions ?? []) {
    if (!first || version.effectiveFrom < first.effectiveFrom) first = version;
  }
  return first;
}
