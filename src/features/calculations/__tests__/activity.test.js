import { ACTIVITY_GROUPS, ACTIVITY_STATEMENTS, ACTIVITY_STATEMENT_IDS, getActivityLevel } from '../activity';

describe('getActivityLevel', () => {
  it('ничего не выбрано — низкая категория по умолчанию', () => {
    expect(getActivityLevel([])).toBe('sedentary');
    expect(getActivityLevel(undefined)).toBe('sedentary');
    expect(getActivityLevel(['unknown'])).toBe('sedentary');
  });

  it('пункты без движения дают низкую категорию', () => {
    expect(getActivityLevel(['mostlySitting'])).toBe('sedentary');
    expect(getActivityLevel(['driveEverywhere', 'screenTime', 'remoteWork'])).toBe('sedentary');
  });

  it('находит категорию по таблице', () => {
    expect(getActivityLevel(['walksRegularly'])).toBe('light');
    expect(getActivityLevel(['mostlySitting', 'yogaStretching'])).toBe('light');
    expect(getActivityLevel(['walksRegularly', 'gym'])).toBe('moderate');
    expect(getActivityLevel(['physicalJob'])).toBe('moderate');
    expect(getActivityLevel(['walksRegularly', 'trainsOften'])).toBe('active');
    expect(getActivityLevel(['onFeetJob', 'running'])).toBe('active');
  });

  it('несколько похожих пунктов не складываются, пока их меньше порога разнообразия', () => {
    expect(getActivityLevel(['walksRegularly', 'usesStairs', 'housework'])).toBe('light');
    expect(getActivityLevel(['gym', 'running'])).toBe('light');
  });

  it('разнообразие повседневного движения и тренировок поднимает признак до уровня 2', () => {
    // 4 разных повседневных пункта → много движения в течение дня
    expect(getActivityLevel(['walksRegularly', 'usesStairs', 'housework', 'gardening'])).toBe('moderate');
    // 3 разных вида умеренных тренировок → частые тренировки
    expect(getActivityLevel(['gym', 'running', 'yogaStretching'])).toBe('moderate');
  });

  it('сидячий день и работа «на ногах» вместе считаются серединой', () => {
    expect(getActivityLevel(['mostlySitting', 'activeWork'])).toBe('light');
    expect(getActivityLevel(['activeWork'])).toBe('moderate');
  });

  it('снижает категорию на одну ступень при нестабильной или сниженной активности', () => {
    expect(getActivityLevel(['onFeetJob', 'trainsOften', 'variesDaily'])).toBe('moderate');
    expect(getActivityLevel(['onFeetJob', 'trainsOften', 'variesDaily', 'movingLessNow'])).toBe('moderate');
    expect(getActivityLevel(['mostlySitting', 'movingLessNow'])).toBe('sedentary');
  });

  it('не зависит от порядка и повторов', () => {
    expect(getActivityLevel(['trainsOften', 'walksRegularly', 'walksRegularly'])).toBe('active');
  });

  it('список утверждений корректен', () => {
    expect(new Set(ACTIVITY_STATEMENT_IDS).size).toBe(ACTIVITY_STATEMENT_IDS.length);
    expect(ACTIVITY_STATEMENT_IDS.length).toBeGreaterThanOrEqual(40);
    for (const statement of ACTIVITY_STATEMENTS) {
      expect(ACTIVITY_GROUPS).toContain(statement.group);
    }
    // id из прошлых версий сохранены — старые профили читаются без миграции
    for (const id of ['mostlySitting', 'walksRegularly', 'usesStairs', 'activeCommute', 'activeHobbies', 'activeWork', 'physicalJob', 'yogaStretching', 'dancing', 'sportsRegularly', 'trainsOften', 'variesDaily']) {
      expect(ACTIVITY_STATEMENT_IDS).toContain(id);
    }
  });
});
