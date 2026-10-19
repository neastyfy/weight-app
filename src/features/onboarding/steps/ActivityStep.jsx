// Шаг: образ жизни. Пункты сгруппированы, плитки в две колонки, можно выбрать сколько угодно.
// Итог (категория и цветная шкала) закреплён внизу над кнопкой — см. ActivityFooter.
// Можно ничего не выбирать — тогда категория «низкая».
import { StyleSheet, View } from 'react-native';

import { AppText, IconBadge, PressableScale } from '@/components';
import { SelectionIndicator } from '@/components/SelectableRow';
import { ACTIVITY_GROUPS, ACTIVITY_STATEMENTS, getActivityLevel } from '@/features/calculations';
import { ActivityLevelView } from '@/features/metrics/ActivityLevelView';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme';

// Иконка группы и её цвет
const GROUP_STYLE = {
  work: ['briefcase-outline', 'primary'],
  transport: ['walk-outline', 'success'],
  home: ['home-outline', 'warning'],
  leisure: ['color-palette-outline', 'pink'],
  sport: ['barbell-outline', 'primary'],
  other: ['swap-vertical-outline', 'purple'],
};

export function ActivityStep({ draft, update }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();

  const toggle = (id) =>
    update((current) => ({
      ...current,
      activityAnswers: current.activityAnswers.includes(id)
        ? current.activityAnswers.filter((answer) => answer !== id)
        : [...current.activityAnswers, id],
    }));

  return (
    <View style={{ gap: spacing.lg }}>
      {ACTIVITY_GROUPS.map((group) => (
        <View key={group} style={{ gap: spacing.xs }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.xs }}>
            <IconBadge icon={GROUP_STYLE[group][0]} tone={GROUP_STYLE[group][1]} size={28} />
            <AppText variant="subheading">{t(`activity.groups.${group}`)}</AppText>
          </View>
          <View style={[styles.grid, { gap: spacing.xs }]}>
            {ACTIVITY_STATEMENTS.filter((statement) => statement.group === group).map(({ id }) => (
              <ActivityTile
                key={id}
                label={t(`activity.statements.${id}`)}
                selected={draft.activityAnswers.includes(id)}
                onPress={() => toggle(id)}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

// Закреплённый итог над кнопкой «Далее»
export function ActivityFooter({ draft }) {
  return <ActivityLevelView level={getActivityLevel(draft.activityAnswers)} compact />;
}

function ActivityTile({ label, selected, onPress }) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View style={styles.cell}>
      <PressableScale
        onPress={onPress}
        scaleTo={0.95}
        accessibilityRole="checkbox"
        accessibilityState={{ checked: selected }}
        accessibilityLabel={label}
        style={({ focused }) => [
          styles.tile,
          {
            padding: spacing.sm,
            gap: spacing.xs,
            borderRadius: radius.md,
            backgroundColor: selected ? colors.primarySoft : colors.surface,
            borderColor: selected ? colors.primary : colors.border,
          },
          focused && { boxShadow: `0px 0px 0px 3px ${colors.focusRing}` },
        ]}
      >
        <AppText variant="small" style={styles.label}>
          {label}
        </AppText>
        <SelectionIndicator selected={selected} round={false} size={20} />
      </PressableScale>
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  tile: {
    borderWidth: 1.5,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  label: {
    flex: 1,
  },
});
