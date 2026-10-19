// Главная: приветствие, последний вес, стрик по дням, цель с прогнозом, показатели здоровья и последние записи.
//
// Данные берутся только из уже загруженных провайдеров (useProfile, useMeasurements) — экран
// сам ничего не читает из базы. Провайдеры обновляют списки после любого добавления,
// изменения или удаления записи, поэтому Главная всегда актуальна без перезагрузки.
// Все вычисления — чистые функции (homeModel, goalModel, goalForecast) с тестами.
import { router } from 'expo-router';
import { useMemo, useRef } from 'react';
import { Animated } from 'react-native';

import { AppText, Button, Card, Screen } from '@/components';
import { getGoalJourney } from '@/features/goals/goalModel';
import { getGoalForecast } from '@/features/goals/goalForecast';
import { useMeasurements } from '@/features/measurements/MeasurementsProvider';
import { changesFromPrevious } from '@/features/measurements/historyHelpers';
import { useProfile } from '@/features/profile';
import { useTranslation } from '@/i18n';
import { useNow } from '@/lib/useNow';

import { CurrentWeightCard } from './CurrentWeightCard';
import { ForecastCard } from './ForecastCard';
import { BodySummary, HealthSummary } from './HealthSummary';
import { HomeHeader } from './HomeHeader';
import { RecentEntries } from './RecentEntries';
import { StreakCard } from './StreakCard';
import { getStreak, getWeightSummary } from './homeModel';

export function HomeScreen() {
  const { t } = useTranslation();
  const { profile, goals } = useProfile();
  const { weightEntries, bodyMeasurements, status, reload } = useMeasurements();
  const now = useNow();
  // Прокрутка экрана: шапка растягивает картинку, когда Главную тянут вниз
  const scrollY = useRef(new Animated.Value(0)).current;

  // Текущая цель — последняя в истории целей (в ней есть дата начала).
  // Запасной вариант — цель из профиля, если истории почему-то нет.
  const goal = useMemo(
    () =>
      goals[goals.length - 1] ?? {
        goalType: profile.goalType,
        targetWeightKg: profile.targetWeightKg,
        startedAt: profile.createdAt,
      },
    [goals, profile.goalType, profile.targetWeightKg, profile.createdAt],
  );

  const summary = useMemo(() => getWeightSummary(weightEntries), [weightEntries]);
  const changes = useMemo(() => changesFromPrevious(weightEntries, 'weightKg'), [weightEntries]);
  const journey = useMemo(
    () => getGoalJourney({ goal, entries: weightEntries, currentWeightKg: summary.latest?.weightKg ?? null }),
    [goal, weightEntries, summary.latest],
  );
  const forecast = useMemo(() => getGoalForecast({ entries: weightEntries, goal, now }), [weightEntries, goal, now]);
  const streak = useMemo(
    () => getStreak(weightEntries, { now, profileCreatedAt: profile.createdAt }),
    [weightEntries, now, profile.createdAt],
  );
  // список окружностей отсортирован: первая талия — последняя по дате
  const latestWaist = useMemo(() => bodyMeasurements.find((m) => m.type === 'waist') ?? null, [bodyMeasurements]);

  return (
    <Screen withTabBar heroTop scrollY={scrollY}>
      <HomeHeader summary={summary} goal={goal} now={now} scrollY={scrollY} />

      {status === 'error' ? (
        <Card>
          <AppText variant="subheading">{t('errors.loadTitle')}</AppText>
          <AppText variant="caption" color="textSecondary">
            {t('errors.loadText')}
          </AppText>
          <Button title={t('common.retry')} variant="secondary" icon="refresh" onPress={reload} />
        </Card>
      ) : status === 'loading' ? (
        <Card>
          <AppText color="textSecondary">{t('common.loading')}</AppText>
        </Card>
      ) : (
        <>
          <CurrentWeightCard summary={summary} goal={goal} journey={journey} now={now} />
          <HealthSummary />
          {summary.latest ? <StreakCard streak={streak} /> : null}
          <ForecastCard forecast={forecast} />
          <RecentEntries entries={weightEntries} changes={changes} now={now} />
        </>
      )}

      <BodySummary latestWaist={latestWaist} />

      {/* Только в режиме разработки (__DEV__): витрина дизайн-системы. В сборке для пользователей её нет.
          Текст не переводится — удалить вместе с экраном design-preview. */}
      {__DEV__ ? (
        <Card>
          <AppText variant="subheading">Для разработки</AppText>
          <Button
            title="Открыть витрину"
            variant="secondary"
            icon="color-palette-outline"
            onPress={() => router.push('/design-preview')}
          />
        </Card>
      ) : null}
    </Screen>
  );
}
