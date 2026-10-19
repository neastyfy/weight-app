// Карточка «Текущий вес» на Главной — как в референсе (assets/references/app_reference.png):
//   сверху — текущий вес крупно, рядом изменение с первой записи (цвет — по цели) и дата,
//   справа круглая кнопка «+» (та же форма добавления, что и «+» в панели вкладок);
//   под разделителем — цель, сколько осталось и полоса прогресса.
// Прогноз достижения цели — в ForecastCard.
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { AppText, Card, EmptyState, PressableScale, ProgressBar } from '@/components';
import { GOAL_PRECISION_KG, findGoalAt } from '@/features/goals/goalModel';
import { dayTitle } from '@/features/measurements/historyHelpers';
import { MAINTAIN_ZONE_KG, getMaintainTone, getWeightEntryTone } from '@/features/metrics/changeTone';
import { useProfile } from '@/features/profile';
import { useTranslation } from '@/i18n';
import { formatNumber, formatShortDate, formatSignedChange, formatTime, formatWeight } from '@/lib/format';
import { fromKg } from '@/lib/units';
import { useTheme } from '@/theme';

// summary — из getWeightSummary, goal — текущая цель, journey — из getGoalJourney,
// now — текущее время (для «Сегодня» / «Вчера»)
export function CurrentWeightCard({ summary, goal, journey, now }) {
  const { t, language } = useTranslation();
  const { colors, spacing } = useTheme();
  const { profile, goals } = useProfile();
  const { latest, first, changeFromFirst } = summary;
  const unit = profile.weightUnit;
  const unitLabel = t(`units.${unit}`);

  if (!latest) {
    return (
      <EmptyState
        mascotId={profile.mascotId}
        title={t('entries.emptyTitle')}
        text={t('weight.emptyText')}
        actionLabel={t('weight.addButton')}
        onAction={() => router.push('/weight/new')}
      />
    );
  }

  // Изменение с первой записи — цвет по цели, как в истории
  const tone = first ? getWeightEntryTone({ change: changeFromFirst, weightKg: latest.weightKg, goal: findGoalAt(goals, latest.measuredAt) }) : null;
  const changeColor = tone ? `${tone}Text` : 'text';
  // Не «сегодняшний вес», а когда именно измерено: «Сегодня, 07:30» / «Пн, 13 октября, 08:00»
  const measuredAt = `${dayTitle(new Date(latest.measuredAt), language, t, now)}, ${formatTime(latest.measuredAt, language)}`;

  return (
    <Card style={{ padding: 0, gap: 0, overflow: 'hidden' }}>
      {/* Текущий вес */}
      <View style={{ padding: spacing.lg, paddingBottom: spacing.md, flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="caption" color="textSecondary">
            {t('home.currentWeight')}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' }}>
            <AppText variant="number">
              {formatWeight(latest.weightKg, unit, language)} {unitLabel}
            </AppText>
            {first ? (
              <View>
                <AppText variant="subheading" color={changeColor}>
                  {formatSignedChange(fromKg(changeFromFirst, unit), language)} {unitLabel}
                </AppText>
                <AppText variant="small" color="textSecondary">
                  {t('home.sinceDate', { date: formatShortDate(first.measuredAt, language, now) })}
                </AppText>
              </View>
            ) : null}
          </View>
          <AppText variant="small" color="textTertiary">
            {measuredAt}
          </AppText>
          {!first ? (
            <AppText variant="caption" color="textSecondary" style={{ marginTop: spacing.xxs }}>
              {t('home.firstEntryHint')}
            </AppText>
          ) : null}
        </View>
        <AddButton />
      </View>

      {/* Цель */}
      <View style={{ padding: spacing.lg, paddingTop: spacing.md, gap: spacing.xs, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border }}>
        <GoalRow goal={goal} journey={journey} latestWeightKg={latest.weightKg} unit={unit} unitLabel={unitLabel} />
      </View>
    </Card>
  );
}

// Строка цели и полоса прогресса. Нет цели — ненавязчивая ссылка «Поставить цель».
function GoalRow({ goal, journey, latestWeightKg, unit, unitLabel }) {
  const { t, language } = useTranslation();
  const { spacing } = useTheme();
  const { goalProgress } = useProfile();
  const weight = (kg) => formatWeight(kg, unit, language);

  if (!goal || goal.goalType === 'none' || goal.targetWeightKg == null) {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
        <AppText variant="caption" color="textSecondary" style={{ flexShrink: 1 }}>
          {t('home.noGoal')}
        </AppText>
        <PressableScale onPress={() => router.push('/goal/edit')} accessibilityRole="link" hitSlop={8}>
          <AppText variant="small" color="primary">
            {t('goal.setGoal')}
          </AppText>
        </PressableScale>
      </View>
    );
  }

  // Справа: сколько осталось / цель достигнута / отклонение при удержании
  let status;
  let statusColor = 'textSecondary';
  if (goal.goalType === 'maintain') {
    const differenceKg = latestWeightKg - goal.targetWeightKg;
    status =
      Math.abs(differenceKg) < GOAL_PRECISION_KG
        ? t('goal.onTarget')
        : t('goal.deviation', { value: formatSignedChange(fromKg(differenceKg, unit), language), unit: unitLabel });
    // зелёный — на цели, жёлтый — в пределах ±3 кг, красный — дальше
    statusColor = `${getMaintainTone(latestWeightKg, goal.targetWeightKg)}Text`;
  } else if (goalProgress === 'reached' || goalProgress === 'exceeded') {
    status = t('home.goalReached');
    statusColor = 'successText';
  } else if (journey) {
    status = t('home.remaining', { value: weight(journey.remainingKg), unit: unitLabel });
  }

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', gap: spacing.sm }}>
        {/* «Цель:» обычным шрифтом, значение — жирным, как в референсе */}
        <AppText variant="body">
          {t('home.goal')}:{' '}
          <AppText variant="heading" style={{ fontSize: 17, lineHeight: 24 }}>
            {weight(goal.targetWeightKg)} {unitLabel}
          </AppText>
        </AppText>
        {status ? (
          <AppText variant="small" color={statusColor} align="right" style={{ flexShrink: 1 }}>
            {status}
          </AppText>
        ) : null}
      </View>
      {goal.goalType === 'maintain' ? (
        <AppText variant="small" color="textTertiary">
          {t('home.maintainZone', { value: weight(MAINTAIN_ZONE_KG), unit: unitLabel })}
        </AppText>
      ) : journey?.fraction != null ? (
        // Доля пути — только если её можно честно посчитать (0–100 %)
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <ProgressBar progress={journey.fraction} gradient="successGradient" height={14} style={{ flex: 1 }} />
          <AppText variant="subheading" color="textSecondary">
            {formatNumber(Math.round(journey.fraction * 100), language)}%
          </AppText>
        </View>
      ) : null}
    </>
  );
}

// Круглая кнопка «+» с градиентом, как в референсе
function AddButton() {
  const { t } = useTranslation();
  const { colors, radius, shadows } = useTheme();
  return (
    <PressableScale
      onPress={() => router.push('/weight/new')}
      accessibilityRole="button"
      accessibilityLabel={t('weight.addButton')}
      scaleTo={0.9}
      style={[{ width: 52, height: 52, borderRadius: radius.pill, overflow: 'hidden' }, shadows.raised]}
    >
      <LinearGradient
        colors={colors.primaryGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
      >
        <Ionicons name="add" size={28} color={colors.textOnPrimary} />
      </LinearGradient>
    </PressableScale>
  );
}
