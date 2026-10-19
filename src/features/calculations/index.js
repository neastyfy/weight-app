// Все расчёты приложения. Только чистые функции — без интерфейса и без базы данных.
export { BMI_CATEGORIES, calculateBmi, getBmiCategory } from './bmi';
export { BMR_FORMULA, calculateBmr, getBmrUnavailableReason } from './bmr';
export {
  ACTIVITY_GROUPS,
  ACTIVITY_LEVELS,
  ACTIVITY_STATEMENTS,
  ACTIVITY_STATEMENT_IDS,
  DEFAULT_ACTIVITY_LEVEL,
  getActivityLevel,
} from './activity';
export { getCurrentAge } from './age';
export { getBodyMetrics } from './bodyMetrics';
export { GOAL_THRESHOLDS, GOAL_TONES, assessGoal } from './goal';
