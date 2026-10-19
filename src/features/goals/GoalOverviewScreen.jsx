// Вкладка «Цель» — «Путь к цели» (как в референсе): целевой вес и кольцо прогресса, прогноз,
// «Твой прогресс», этапы пути, доброе сообщение маскота и история целей.
// Все числа — из реальных записей (goalModel, goalForecast); ничего не выдумывается.
// Изменить или убрать цель — кнопка «Изменить» (экран /goal/edit).
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText, Button, Card, IconBadge, PressableScale, ProgressRing, Screen, ScreenHeader, SectionHeader } from '@/components';
import { Mascot } from '@/features/mascots';
import { useMeasurements } from '@/features/measurements/MeasurementsProvider';
import { MAINTAIN_ZONE_KG, getMaintainTone } from '@/features/metrics/changeTone';
import { useProfile } from '@/features/profile';
import { useTranslation } from '@/i18n';
import { formatFullDate, formatNumber, formatShortDate, formatSignedChange, formatWeight } from '@/lib/format';
import { fromKg } from '@/lib/units';
import { useNow } from '@/lib/useNow';
import { useTheme } from '@/theme';

import { getGoalForecast } from './goalForecast';
import { GOAL_PRECISION_KG, getGoalHistory, getGoalJourney, getGoalMilestones } from './goalModel';

export function GoalOverviewScreen() {
  const { t, language } = useTranslation();
  const { spacing } = useTheme();
  const { profile, goals, goalProgress, latestWeight } = useProfile();
  const { weightEntries } = useMeasurements();
  const now = useNow();

  const unit = profile.weightUnit;
  const unitLabel = t(`units.${unit}`);
  const weight = (kg) => `${formatWeight(kg, unit, language)} ${unitLabel}`;
  const signed = (kg) => `${formatSignedChange(fromKg(kg, unit), language)} ${unitLabel}`;

  const goal = goals[goals.length - 1] ?? null;
  const hasGoal = goal != null && goal.goalType !== 'none' && goal.targetWeightKg != null;
  const currentKg = latestWeight?.weightKg ?? null;

  const journey = useMemo(() => getGoalJourney({ goal, entries: weightEntries, currentWeightKg: currentKg }), [goal, weightEntries, currentKg]);
  const forecast = useMemo(() => getGoalForecast({ entries: weightEntries, goal, now }), [weightEntries, goal, now]);
  const milestones = useMemo(() => getGoalMilestones(goal, weightEntries), [goal, weightEntries]);
  const history = useMemo(() => getGoalHistory(goals, weightEntries), [goals, weightEntries]);

  const reached = goalProgress === 'reached' || goalProgress === 'exceeded';
  const editButton = (
    <PressableScale onPress={() => router.push('/goal/edit')} accessibilityRole="link" hitSlop={8}>
      <AppText variant="small" color="primary">
        {hasGoal ? t('goal.change') : t('goal.setGoal')}
      </AppText>
    </PressableScale>
  );

  return (
    <Screen withTabBar>
      <ScreenHeader title={t('goals.title')} />

      {!hasGoal ? (
        <Card style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl }}>
          <Mascot mascotId={profile.mascotId} state="goal" size={140} />
          <AppText variant="heading" align="center">
            {t('home.noGoal')}
          </AppText>
          <AppText color="textSecondary" align="center">
            {t('home.noGoalText')}
          </AppText>
          <Button title={t('goal.setGoal')} icon="flag" onPress={() => router.push('/goal/edit')} style={{ alignSelf: 'stretch' }} />
        </Card>
      ) : (
        <>
          {/* Целевой вес и кольцо */}
          <Card style={{ gap: spacing.sm }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <AppText variant="caption" color="textSecondary">
                {t('goals.target')} · {t(`goal.types.${goal.goalType}`)}
              </AppText>
              {editButton}
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
              <View style={{ flex: 1, gap: spacing.xxs }}>
                <AppText variant="number">{weight(goal.targetWeightKg)}</AppText>
                <GoalStatus goal={goal} journey={journey} currentKg={currentKg} reached={reached} weight={weight} signed={signed} />
              </View>
              {goal.goalType !== 'maintain' && journey?.fraction != null ? (
                <ProgressRing progress={journey.fraction} size={112} label={`${formatNumber(Math.round(journey.fraction * 100), language)}%`} />
              ) : null}
            </View>
            {goal.goalType === 'maintain' ? (
              <AppText variant="small" color="textTertiary">
                {t('home.maintainZone', { value: formatWeight(MAINTAIN_ZONE_KG, unit, language), unit: unitLabel })}
              </AppText>
            ) : null}
            {forecast.status === 'ok' && !reached ? (
              <View style={[styles.row, { gap: spacing.sm, paddingTop: spacing.sm }]}>
                <IconBadge icon="calendar-outline" tone="pink" size={36} />
                <View style={{ flex: 1 }}>
                  <AppText variant="subheading">{t('goals.daysLeft', { days: formatNumber(forecast.daysLeft, language) })}</AppText>
                  <AppText variant="small" color="textSecondary">
                    {t('goals.atCurrentPace')}
                  </AppText>
                </View>
              </View>
            ) : null}
          </Card>

          {/* Твой прогресс */}
          {journey ? (
            <View style={{ gap: spacing.sm }}>
              <SectionHeader title={t('goals.progressTitle')} />
              <Card style={{ gap: spacing.xs }}>
                <StatRow label={t('goals.startWeight')} value={weight(journey.startWeightKg)} />
                <StatRow label={t('goals.currentWeight')} value={currentKg != null ? weight(currentKg) : '-'} />
                <StatRow
                  label={t('goals.totalChange')}
                  value={signed(journey.changeKg)}
                  color={journey.doneKg >= GOAL_PRECISION_KG ? 'successText' : 'text'}
                />
                {forecast.rateKgPerWeek != null ? (
                  <StatRow label={t('goals.pace')} value={`${signed(forecast.rateKgPerWeek)}${t('goals.perWeek')}`} />
                ) : null}
                {forecast.status === 'ok' && !reached ? (
                  <StatRow label={t('goals.targetDate')} value={`~ ${formatFullDate(forecast.expectedDate.toISOString(), language)}`} />
                ) : null}
              </Card>
            </View>
          ) : null}

          {/* Этапы пути: отмечены только по реальным записям */}
          {milestones ? (
            <View style={{ gap: spacing.sm }}>
              <SectionHeader title={t('goals.milestonesTitle')} />
              <Card style={{ gap: spacing.sm }}>
                {milestones.map((milestone) => (
                  <MilestoneRow key={milestone.fraction} milestone={milestone} weight={weight} />
                ))}
              </Card>
            </View>
          ) : null}

          {/* Доброе сообщение маскота */}
          <EncouragementCard reached={reached} progressMade={(journey?.doneKg ?? 0) >= GOAL_PRECISION_KG} goalType={goal.goalType} />
        </>
      )}

      {/* История целей */}
      {history.length ? (
        <View style={{ gap: spacing.sm }}>
          <SectionHeader title={t('goals.historyTitle')} />
          <Card style={{ gap: 0, paddingVertical: spacing.xxs }}>
            {history.map((item, index) => (
              <HistoryRow key={item.id} item={item} divider={index > 0} weight={weight} />
            ))}
          </Card>
          <AppText variant="small" color="textTertiary" align="center">
            {t('goals.historyNote')}
          </AppText>
        </View>
      ) : null}
    </Screen>
  );
}

// Под целевым весом: сколько осталось / достигнута / отклонение при удержании
function GoalStatus({ goal, journey, currentKg, reached, weight, signed }) {
  const { t } = useTranslation();
  if (currentKg == null) {
    return (
      <AppText variant="caption" color="textSecondary">
        {t('home.noWeightForGoal')}
      </AppText>
    );
  }
  if (goal.goalType === 'maintain') {
    const difference = currentKg - goal.targetWeightKg;
    const onTarget = Math.abs(difference) < GOAL_PRECISION_KG;
    return (
      <AppText variant="subheading" color={`${getMaintainTone(currentKg, goal.targetWeightKg)}Text`}>
        {onTarget ? t('goal.onTarget') : t('goals.deviation', { value: signed(difference) })}
      </AppText>
    );
  }
  if (reached) {
    return (
      <AppText variant="subheading" color="successText">
        {t('home.goalReached')}
      </AppText>
    );
  }
  return journey ? (
    <AppText variant="subheading" color="textSecondary">
      {t('goals.remaining', { value: weight(journey.remainingKg) })}
    </AppText>
  ) : null;
}

function StatRow({ label, value, color = 'text' }) {
  const { spacing } = useTheme();
  return (
    <View style={[styles.row, { justifyContent: 'space-between', gap: spacing.sm }]}>
      <AppText variant="caption" color="textSecondary" style={{ flexShrink: 1 }}>
        {label}
      </AppText>
      <AppText variant="subheading" color={color}>
        {value}
      </AppText>
    </View>
  );
}

function MilestoneRow({ milestone, weight }) {
  const { t, language } = useTranslation();
  const { colors, spacing } = useTheme();
  const done = milestone.reachedAt != null;
  return (
    <View style={[styles.row, { gap: spacing.sm }]}>
      <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={26} color={done ? colors.success : colors.textTertiary} />
      <View style={{ flex: 1 }}>
        <AppText variant="subheading">{t(`goals.milestones.${milestone.fraction * 100}`)}</AppText>
        <AppText variant="small" color="textSecondary">
          {weight(milestone.weightKg)}
        </AppText>
      </View>
      <AppText variant="small" color={done ? 'successText' : 'textTertiary'}>
        {done ? formatShortDate(milestone.reachedAt, language) : t('goals.ahead')}
      </AppText>
    </View>
  );
}

function EncouragementCard({ reached, progressMade, goalType }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const { profile } = useProfile();
  const key = reached ? 'reached' : goalType === 'maintain' ? 'maintain' : progressMade ? 'onTrack' : 'start';
  return (
    <Card style={[styles.row, { gap: spacing.sm }]}>
      <Mascot mascotId={profile.mascotId} state={reached || progressMade ? 'happy' : 'goal'} size={84} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText variant="subheading">{t(`goals.encouragement.${key}.title`)}</AppText>
        <AppText variant="caption" color="textSecondary">
          {t(`goals.encouragement.${key}.text`)}
        </AppText>
      </View>
    </Card>
  );
}

const STATUS_STYLE = {
  active: ['flag', 'primary', 'primary'],
  reached: ['trophy-outline', 'success', 'successText'],
  replaced: ['swap-horizontal-outline', 'purple', 'textSecondary'],
  none: ['remove-circle-outline', 'warning', 'textSecondary'],
};

function HistoryRow({ item, divider, weight }) {
  const { t, language } = useTranslation();
  const { colors, spacing } = useTheme();
  const [icon, tone, color] = STATUS_STYLE[item.status];
  const period = item.endedAt
    ? `${formatShortDate(item.startedAt, language)} – ${formatShortDate(item.endedAt, language)}`
    : t('goals.since', { date: formatShortDate(item.startedAt, language) });
  return (
    <View
      style={[
        styles.row,
        { gap: spacing.sm, paddingVertical: spacing.sm },
        divider && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
      ]}
    >
      <IconBadge icon={icon} tone={tone} size={36} />
      <View style={{ flex: 1 }}>
        <AppText variant="subheading">
          {item.goalType === 'none' ? t('goals.removed') : `${t(`goal.types.${item.goalType}`)} · ${weight(item.targetWeightKg)}`}
        </AppText>
        <AppText variant="small" color="textSecondary">
          {period}
        </AppText>
      </View>
      {item.goalType !== 'none' ? (
        <AppText variant="small" color={color}>
          {t(`goals.status.${item.status}`)}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
});
