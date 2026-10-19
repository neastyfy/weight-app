// История одной окружности (например, талии): подсказка, кнопка «Добавить» и записи, новые сверху.
import { router } from 'expo-router';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText, Button, Card, EmptyState, PageTransition, SafeAreaTopBand, ScreenHeader } from '@/components';
import { findGoalAt } from '@/features/goals/goalModel';
import { getChangeTone } from '@/features/metrics/changeTone';
import { useProfile } from '@/features/profile';
import { useTranslation } from '@/i18n';
import { formatCircumference, formatDate, formatSignedChange, formatTime } from '@/lib/format';
import { fromCm } from '@/lib/units';
import { useTheme } from '@/theme';

import { EntryNotFound } from './EntryNotFound';
import { EntryRow } from './EntryRow';
import { useMeasurements } from './MeasurementsProvider';
import { changesFromPrevious } from './historyHelpers';
import { getBodyMeasurementType } from './measurementModel';

export function BodyTypeHistoryScreen({ type }) {
  const { t, language } = useTranslation();
  const { colors, spacing, layout } = useTheme();
  const insets = useSafeAreaInsets();
  const { profile, goals } = useProfile();
  const { bodyMeasurements, status } = useMeasurements();

  const config = getBodyMeasurementType(type);
  if (!config) return <EntryNotFound />;

  const unit = profile.heightUnit;
  const unitLabel = t(`units.${unit}`);
  const entries = bodyMeasurements.filter((m) => m.type === type);
  const changes = changesFromPrevious(entries, 'valueCm');
  const addNew = () => router.push(`/body/${type}/new`);

  return (
    <PageTransition style={{ backgroundColor: colors.background }}>
      <FlatList
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={{
          paddingTop: insets.top + spacing.md,
          paddingBottom: insets.bottom + spacing.xxl,
          paddingHorizontal: layout.screenPadding,
        }}
        data={entries}
        keyExtractor={(entry) => String(entry.id)}
        ListHeaderComponent={
          <View style={{ gap: spacing.lg, marginBottom: spacing.lg }}>
            <ScreenHeader title={t(`body.types.${type}`)} showBack />
            <AppText color="textSecondary">{t(`body.hints.${type}`)}</AppText>
            {entries.length > 0 ? (
              <Button title={t('body.addButton')} icon="add" variant="secondary" onPress={addNew} />
            ) : null}
          </View>
        }
        ListEmptyComponent={
          status === 'loading' ? null : (
            <EmptyState
              mascotId={profile.mascotId}
              title={t('entries.emptyTitle')}
              text={t('body.emptyText')}
              actionLabel={t('body.addButton')}
              onAction={addNew}
            />
          )
        }
        renderItem={({ item: entry, index }) => {
          const change = changes.get(entry.id);
        // Окружности окрашиваются по цели, действовавшей в момент измерения
        const goalType = findGoalAt(goals, entry.measuredAt)?.goalType ?? 'none';
          return (
            <Card
              style={{
                gap: 0,
                paddingVertical: 0,
                borderRadius: 0,
                borderTopLeftRadius: index === 0 ? 20 : 0,
                borderTopRightRadius: index === 0 ? 20 : 0,
                borderBottomLeftRadius: index === entries.length - 1 ? 20 : 0,
                borderBottomRightRadius: index === entries.length - 1 ? 20 : 0,
                boxShadow: 'none',
              }}
            >
              <EntryRow
                divider={index > 0}
                label={`${formatDate(entry.measuredAt, language)}, ${formatTime(entry.measuredAt, language)}`}
                note={entry.note}
                value={formatCircumference(entry.valueCm, unit, language)}
                unit={unitLabel}
                change={change != null ? `${formatSignedChange(fromCm(change, unit), language)} ${unitLabel}` : null}
                changeValue={change}
                changeTone={getChangeTone(change, goalType)}
                onPress={() => router.push(`/body/entry/${entry.id}`)}
              />
            </Card>
          );
        }}
      />
      <SafeAreaTopBand />
    </PageTransition>
  );
}
