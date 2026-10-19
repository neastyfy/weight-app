// Все показатели профиля одним вызовом — экраны используют только эту функцию.
import { getActivityLevel } from './activity';
import { getCurrentAge } from './age';
import { calculateBmi, getBmiCategory } from './bmi';
import { calculateBmr, getBmrUnavailableReason } from './bmr';

// profile — профиль из базы, weightKg — последний записанный вес (или null)
export function getBodyMetrics(profile, weightKg, now = new Date()) {
  const ageYears = getCurrentAge(profile.ageYears, profile.ageRecordedAt, now);
  const bmrInput = { weightKg, heightCm: profile.heightCm, ageYears, sex: profile.sex };
  const bmi = calculateBmi(weightKg, profile.heightCm);

  return {
    ageYears,
    bmi,
    bmiCategory: getBmiCategory(bmi, ageYears),
    bmr: calculateBmr(bmrInput),
    bmrUnavailableReason: getBmrUnavailableReason(bmrInput),
    activityLevel: getActivityLevel(profile.activityAnswers),
  };
}
