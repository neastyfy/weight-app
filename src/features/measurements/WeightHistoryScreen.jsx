// История веса: записи по дням, новые сверху. Нажатие на запись — редактирование.
import { router } from 'expo-router';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Card, EmptyState, PageTransition, SafeAreaTopBand, ScreenHeader } from '@/components';
import { findGoalAt } from '@/features/goals/goalModel';
import { getWeightEntryTone } from '@/features/metrics/changeTone';
import { useProfile } from '@/features/profile';
import { useTranslation } from '@/i18n';
import { formatSignedChange, formatTime, formatWeight } from '@/lib/format';
import { fromKg } from '@/lib/units';
import { useTheme } from '@/theme';

import { EntryRow } from './EntryRow';
import { useMeasurements } from './MeasurementsProvider';
import { changesFromPrevious, dayTitle, groupByDay } from './historyHelpers';

export function WeightHistoryScreen() {
  const { t, language } = useTranslation();
  const { colors, spacing, layout } = useTheme();
  const insets = useSafeAreaInsets();
  const { profile, goals } = useProfile();
  const { weightEntries, status } = useMeasurements();
  const unit = profile.weightUnit;
  const unitLabel = t(`units.${unit}`);

  const days = groupByDay(weightEntries);
  const changes = changesFromPrevious(weightEntries, 'weightKg');

  const header = (
    <View style={{ gap: spacing.lg, marginBottom: spacing.lg }}>
      <ScreenHeader title={t('weight.historyTitle')} showBack />
      {weightEntries.length > 0 ? (
        <Button
          title={t('weight.addButton')}
          icon="add"
          variant="secondary"
          onPress={() => router.push('/weight/new')}
        />
      ) : null}
    </View>
  );

  return (
    <PageTransition style={{ backgroundColor: colors.background }}>
      <FlatList
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing.xxl,
          paddingHorizontal: layout.screenPadding,
        }}
        data={days}
        keyExtractor={(day) => day.key}
        ListHeaderComponent={header}
        ListEmptyComponent={
          status === 'loading' ? null : (
            <EmptyState
              mascotId={profile.mascotId}
              title={t('entries.emptyTitle')}
              text={t('weight.emptyText')}
              actionLabel={t('weight.addButton')}
              onAction={() => router.push('/weight/new')}
            />
          )
        }
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        renderItem={({ item: day }) => (
          <View style={{ gap: spacing.xs }}>
            <AppText variant="small" color="textSecondary">
              {dayTitle(day.date, language, t)}
            </AppText>
            <Card style={{ gap: 0, paddingVertical: spacing.xxs }}>
              {day.entries.map((entry, index) => {
                const change = changes.get(entry.id);
              // Цель, действовавшая в момент измерения: от неё зависит цвет
              const goal = findGoalAt(goals, entry.measuredAt);
              const goalType = goal?.goalType ?? 'none';
                return (
                  <EntryRow
                    key={entry.id}
                    divider={index > 0}
                    label={formatTime(entry.measuredAt, language)}
                    note={entry.note}
                    value={formatWeight(entry.weightKg, unit, language)}
                    unit={unitLabel}
                    change={
                      change != null ? `${formatSignedChange(fromKg(change, unit), language)} ${unitLabel}` : null
                    }
                    changeValue={change}
                    changeTone={getWeightEntryTone({ change, weightKg: entry.weightKg, goal })}
                  goalLabel={t('goal.entryLabel', { type: t(`goal.types.${goalType}`) })}
                    onPress={() => router.push(`/weight/${entry.id}`)}
                  />
                );
              })}
            </Card>
          </View>
        )}
      />
      <SafeAreaTopBand />
    </PageTransition>
  );
}
