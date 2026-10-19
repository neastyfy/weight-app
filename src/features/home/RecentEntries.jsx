// Несколько последних записей веса с изменениями и переход ко всей истории.
// Строки — те же, что в истории (EntryRow): нажатие открывает редактирование записи.
import { router } from 'expo-router';
import { View } from 'react-native';

import { Card, SectionHeader } from '@/components';
import { findGoalAt } from '@/features/goals/goalModel';
import { EntryRow } from '@/features/measurements/EntryRow';
import { dayTitle } from '@/features/measurements/historyHelpers';
import { getWeightEntryTone } from '@/features/metrics/changeTone';
import { useProfile } from '@/features/profile';
import { useTranslation } from '@/i18n';
import { formatSignedChange, formatTime, formatWeight } from '@/lib/format';
import { fromKg } from '@/lib/units';
import { useTheme } from '@/theme';

export const RECENT_ENTRIES_COUNT = 5;

// entries — все записи (новые сверху), changes — Map id → изменение к предыдущей (changesFromPrevious)
export function RecentEntries({ entries, changes, now }) {
  const { t, language } = useTranslation();
  const { spacing } = useTheme();
  const { profile, goals } = useProfile();
  const unit = profile.weightUnit;
  const unitLabel = t(`units.${unit}`);

  if (entries.length === 0) return null;

  return (
    <View style={{ gap: spacing.sm }}>
      <SectionHeader title={t('home.recentTitle')} linkLabel={t('home.allHistory')} onLinkPress={() => router.push('/weight')} />
      <Card style={{ gap: 0, paddingVertical: spacing.xxs }}>
        {entries.slice(0, RECENT_ENTRIES_COUNT).map((entry, index) => {
          const change = changes.get(entry.id);
          return (
            <EntryRow
              key={entry.id}
              divider={index > 0}
              label={`${dayTitle(new Date(entry.measuredAt), language, t, now)}, ${formatTime(entry.measuredAt, language)}`}
              note={entry.note}
              value={formatWeight(entry.weightKg, unit, language)}
              unit={unitLabel}
              change={change != null ? `${formatSignedChange(fromKg(change, unit), language)} ${unitLabel}` : null}
              changeValue={change}
              changeTone={getWeightEntryTone({ change, weightKg: entry.weightKg, goal: findGoalAt(goals, entry.measuredAt) })}
              onPress={() => router.push(`/weight/${entry.id}`)}
            />
          );
        })}
      </Card>
    </View>
  );
}
