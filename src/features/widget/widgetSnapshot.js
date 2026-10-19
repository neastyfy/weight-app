// Снимок данных для iOS-виджета — чистая функция (тесты: __tests__/widgetSnapshot.test.js).
//
// Виджет не читает базу приложения. Приложение само готовит маленький JSON только с тем,
// что виджет показывает, — уже переведённым и отформатированным (единицы, язык, даты):
//   вес и дата последней записи, изменение к предыдущей, цель и прогресс, короткое сообщение.
// В снимок НЕ попадают: имя, фото, комментарии, история записей, рост, возраст и пол.
//
// Даты — без «сегодня» и «вчера» (снимок может пролежать несколько дней): «19 окт.».
// Устаревание виджет проверяет сам по measuredAt и staleAfterDays.

import { findGoalAt, getGoalJourney, getGoalProgress, GOAL_PRECISION_KG } from '@/features/goals/goalModel';
import { getWeightSummary } from '@/features/home/homeModel';
import { getMaintainTone, getWeightEntryTone } from '@/features/metrics/changeTone';
import { formatShortDate, formatSignedChange, formatWeight, getLocale } from '@/lib/format';
import { fromKg } from '@/lib/units';

import { WIDGET_SNAPSHOT_VERSION, WIDGET_STALE_AFTER_DAYS } from './widgetConfig';

// profile — профиль (или null), weightEntries — записи веса (новые сверху), goals — история целей,
// t / language — перевод и язык интерфейса, now — время сборки снимка.
// Возвращает объект снимка или null, если профиля нет (виджет покажет «откройте приложение»).
export function buildWidgetSnapshot({ profile, weightEntries, goals, t, language, now = new Date() }) {
  if (!profile) return null;
  const unit = profile.weightUnit;
  const unitLabel = t(`units.${unit}`);
  const weight = (kg) => formatWeight(kg, unit, language);
  const { latest, changeFromPrevious } = getWeightSummary(weightEntries ?? []);
  const goal = goals?.length ? goals[goals.length - 1] : null;

  const snapshot = {
    version: WIDGET_SNAPSHOT_VERSION,
    updatedAt: now.toISOString(),
    locale: getLocale(language),
    staleAfterDays: WIDGET_STALE_AFTER_DAYS,
    unit: unitLabel,
    hasData: Boolean(latest),
    weight: null,
    measuredAt: null,
    dateText: null,
    change: null,
    changeTone: 'neutral',
    goal: null,
    message: t('widget.message'),
    labels: {
      title: t('widget.title'),
      goal: t('home.goal'),
      empty: t('widget.empty'),
      stale: t('widget.stale'),
    },
  };
  if (!latest) return snapshot;

  snapshot.weight = weight(latest.weightKg);
  snapshot.measuredAt = latest.measuredAt;
  snapshot.dateText = formatShortDate(latest.measuredAt, language, now);
  if (changeFromPrevious != null) {
    snapshot.change = `${formatSignedChange(fromKg(changeFromPrevious, unit), language)} ${unitLabel}`;
    const tone = getWeightEntryTone({ change: changeFromPrevious, weightKg: latest.weightKg, goal: findGoalAt(goals, latest.measuredAt) });
    snapshot.changeTone = tone ?? 'neutral';
  }

  if (goal && goal.goalType !== 'none' && goal.targetWeightKg != null) {
    const target = `${weight(goal.targetWeightKg)} ${unitLabel}`;
    if (goal.goalType === 'maintain') {
      const difference = latest.weightKg - goal.targetWeightKg;
      snapshot.goal = {
        type: 'maintain',
        target,
        progress: null,
        status:
          Math.abs(difference) < GOAL_PRECISION_KG
            ? t('goal.onTarget')
            : t('goal.deviation', { value: formatSignedChange(fromKg(difference, unit), language), unit: unitLabel }),
        statusTone: getMaintainTone(latest.weightKg, goal.targetWeightKg),
      };
    } else {
      const journey = getGoalJourney({ goal, entries: weightEntries, currentWeightKg: latest.weightKg });
      const progress = getGoalProgress({ goalType: goal.goalType, targetWeightKg: goal.targetWeightKg, currentWeightKg: latest.weightKg });
      const reached = progress === 'reached' || progress === 'exceeded';
      snapshot.goal = {
        type: goal.goalType,
        target,
        progress: journey?.fraction ?? null,
        status: reached
          ? t('home.goalReached')
          : journey
            ? t('home.remaining', { value: weight(journey.remainingKg), unit: unitLabel })
            : '',
        statusTone: reached ? 'success' : 'neutral',
      };
    }
  }
  return snapshot;
}
