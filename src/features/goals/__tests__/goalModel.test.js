import { determineGoalType, findGoalAt, getGoalHistory, getGoalJourney, getGoalMilestones, getGoalProgress, getGoalStartWeight } from '../goalModel';

describe('тип цели', () => {
  it('определяется по введённому целевому и текущему весу', () => {
    expect(determineGoalType(69, 70)).toBe('lose');
    expect(determineGoalType(75, 70)).toBe('gain');
    expect(determineGoalType(70.3, 70)).toBe('maintain');
    expect(determineGoalType(70, 70)).toBe('maintain');
    expect(determineGoalType(null, 70)).toBe('none');
  });
});

describe('достижение цели', () => {
  it('похудение', () => {
    expect(getGoalProgress({ goalType: 'lose', targetWeightKg: 68, currentWeightKg: 70 })).toBe('inProgress');
    expect(getGoalProgress({ goalType: 'lose', targetWeightKg: 68, currentWeightKg: 68.02 })).toBe('reached');
    expect(getGoalProgress({ goalType: 'lose', targetWeightKg: 68, currentWeightKg: 67.4 })).toBe('exceeded');
  });

  it('набор', () => {
    expect(getGoalProgress({ goalType: 'gain', targetWeightKg: 60, currentWeightKg: 58 })).toBe('inProgress');
    expect(getGoalProgress({ goalType: 'gain', targetWeightKg: 60, currentWeightKg: 60 })).toBe('reached');
    expect(getGoalProgress({ goalType: 'gain', targetWeightKg: 60, currentWeightKg: 61 })).toBe('exceeded');
  });

  it('удержание и отсутствие цели не «достигаются»', () => {
    expect(getGoalProgress({ goalType: 'maintain', targetWeightKg: 70, currentWeightKg: 70 })).toBeNull();
    expect(getGoalProgress({ goalType: 'none', targetWeightKg: null, currentWeightKg: 70 })).toBeNull();
    expect(getGoalProgress({ goalType: 'lose', targetWeightKg: 68, currentWeightKg: null })).toBeNull();
  });
});

describe('цель на дату записи', () => {
  const goals = [
    { id: 2, goalType: 'maintain', startedAt: '2026-11-01T10:00:00.000Z' },
    { id: 1, goalType: 'lose', startedAt: '2026-10-18T10:00:00.000Z' },
  ];

  it('берёт последнюю цель, начатую до измерения', () => {
    expect(findGoalAt(goals, '2026-10-20T08:00:00.000Z').goalType).toBe('lose');
    expect(findGoalAt(goals, '2026-11-01T10:00:00.000Z').goalType).toBe('maintain');
    expect(findGoalAt(goals, '2026-12-01T08:00:00.000Z').goalType).toBe('maintain');
  });

  it('запись раньше первой цели относится к первой цели', () => {
    expect(findGoalAt(goals, '2026-01-01T08:00:00.000Z').goalType).toBe('lose');
  });

  it('без целей — null', () => {
    expect(findGoalAt([], '2026-10-20T08:00:00.000Z')).toBeNull();
  });
});

describe('путь к цели', () => {
  const goal = { goalType: 'lose', targetWeightKg: 75, startedAt: '2026-09-01T08:00:00.000Z' };
  const entries = [
    { weightKg: 82, measuredAt: '2026-08-20T08:00:00.000Z' },
    { weightKg: 83, measuredAt: '2026-08-31T08:00:00.000Z' }, // последняя до цели
    { weightKg: 80, measuredAt: '2026-09-02T08:00:00.000Z' }, // первая запись новой цели — старт
    { weightKg: 78, measuredAt: '2026-10-01T08:00:00.000Z' },
  ];

  it('вес на старте цели', () => {
    expect(getGoalStartWeight(goal, entries)).toBe(80);
    // запись ровно в момент постановки цели (как при онбординге) — тоже старт
    expect(getGoalStartWeight(goal, [...entries, { weightKg: 81, measuredAt: goal.startedAt }])).toBe(81);
    // после постановки цели записей ещё нет — старт = последний вес до цели, прогресс 0
    expect(getGoalStartWeight(goal, entries.slice(0, 2))).toBe(83);
    expect(getGoalJourney({ goal, entries: entries.slice(0, 2), currentWeightKg: 83 }).fraction).toBe(0);
  });

  it('запись задним числом, внесённая после постановки цели, — часть цели', () => {
    const old = { weightKg: 85, measuredAt: '2026-08-25T08:00:00.000Z', createdAt: '2026-08-25T08:00:00.000Z' };
    const backdated = { weightKg: 84, measuredAt: '2026-08-28T08:00:00.000Z', createdAt: '2026-09-05T10:00:00.000Z' };
    const later = { weightKg: 80, measuredAt: '2026-09-10T08:00:00.000Z', createdAt: '2026-09-10T08:00:00.000Z' };
    // старт — самая ранняя по дате запись цели (задним числом), а не старая запись до цели
    expect(getGoalStartWeight(goal, [old, backdated, later])).toBe(84);
    const journey = getGoalJourney({ goal, entries: [old, backdated, later], currentWeightKg: 80 });
    expect(journey.fraction).toBeCloseTo(4 / 9);
    expect(getGoalStartWeight(goal, [])).toBeNull();
  });

  it('доля пройденного пути', () => {
    const journey = getGoalJourney({ goal, entries, currentWeightKg: 78 });
    expect(journey.startWeightKg).toBe(80);
    expect(journey.doneKg).toBeCloseTo(2);
    expect(journey.remainingKg).toBeCloseTo(3);
    expect(journey.fraction).toBeCloseTo(0.4);
  });

  it('вес ушёл в обратную сторону — доля 0, а не отрицательная', () => {
    const journey = getGoalJourney({ goal, entries, currentWeightKg: 81 });
    expect(journey.fraction).toBe(0);
    expect(journey.doneKg).toBeCloseTo(-1);
  });

  it('цель перевыполнена — доля 1, а не больше', () => {
    const journey = getGoalJourney({ goal, entries, currentWeightKg: 74 });
    expect(journey.fraction).toBe(1);
    expect(journey.remainingKg).toBe(0);
  });

  it('старт уже был за целью (сменили направление) — доли нет', () => {
    const journey = getGoalJourney({ goal: { ...goal, targetWeightKg: 81 }, entries, currentWeightKg: 80.5 });
    expect(journey.fraction).toBeNull();
  });

  it('набор веса', () => {
    const journey = getGoalJourney({ goal: { ...goal, goalType: 'gain', targetWeightKg: 84 }, entries, currentWeightKg: 82 });
    expect(journey.fraction).toBeCloseTo(0.5);
  });

  it('удержание и нет данных — пути нет', () => {
    expect(getGoalJourney({ goal: { ...goal, goalType: 'maintain' }, entries, currentWeightKg: 80 })).toBeNull();
    expect(getGoalJourney({ goal, entries: [], currentWeightKg: 80 })).toBeNull();
  });
});

describe('этапы и история целей', () => {
  const at = (day) => `2026-10-${String(day).padStart(2, '0')}T08:00:00.000Z`;
  const entry = (day, weightKg) => ({ id: day, weightKg, measuredAt: at(day), createdAt: at(day) });
  const goal = { id: 1, goalType: 'lose', targetWeightKg: 76, startedAt: at(1) };

  it('этап засчитывается по первой реальной записи, на которой он пройден', () => {
    const milestones = getGoalMilestones(goal, [entry(1, 80), entry(5, 79.2), entry(9, 77.9), entry(12, 78.4)]);
    expect(milestones.map((m) => m.fraction)).toEqual([0.25, 0.5, 0.75, 1]);
    expect(milestones[0]).toMatchObject({ weightKg: 79, reachedAt: at(9) }); // 79,2 ещё не четверть пути
    expect(milestones[1]).toMatchObject({ weightKg: 78, reachedAt: at(9) });
    expect(milestones[2].reachedAt).toBeNull();
    expect(milestones[3].reachedAt).toBeNull();
  });

  it('без записей цели этапов нет; удержание — без этапов', () => {
    expect(getGoalMilestones(goal, [])).toBeNull();
    expect(getGoalMilestones({ ...goal, goalType: 'maintain' }, [entry(1, 80)])).toBeNull();
  });

  it('история: достигнута только по реальным записям периода', () => {
    const goals = [
      goal,
      { id: 2, goalType: 'none', targetWeightKg: null, startedAt: at(10) },
      { id: 3, goalType: 'lose', targetWeightKg: 74, startedAt: at(15) },
    ];
    const history = getGoalHistory(goals, [entry(1, 80), entry(8, 75.9), entry(16, 75)]);
    expect(history.map((g) => [g.id, g.status, g.endedAt])).toEqual([
      [3, 'active', null],
      [2, 'none', at(15)],
      [1, 'reached', at(10)],
    ]);
  });

  it('цель сменили, не достигнув — «заменена», а не «провалена»', () => {
    const history = getGoalHistory([goal, { id: 2, goalType: 'lose', targetWeightKg: 78, startedAt: at(5) }], [entry(1, 80)]);
    expect(history[1].status).toBe('replaced');
  });
});
