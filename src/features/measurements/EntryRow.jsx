// Строка записи в истории: время или дата слева, комментарий, справа значение и изменение.
// changeValue — изменение числом (для стрелки ↑/↓), changeTone — цвет: 'success' | 'error' | null.
// goalLabel — какая цель действовала в момент записи («Цель: похудение»).
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText, PressableScale } from '@/components';
import { useTheme } from '@/theme';

export function EntryRow({ label, goalLabel, note, value, unit, change, changeValue, changeTone, onPress, divider }) {
  const { colors, spacing } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.98}
      accessibilityRole="button"
      accessibilityLabel={`${label}, ${value} ${unit}`}
      style={[
        styles.row,
        { gap: spacing.sm, paddingVertical: spacing.sm },
        divider && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
      ]}
    >
      <View style={styles.left}>
        <AppText variant="subheading">{label}</AppText>
        {goalLabel ? (
          <AppText variant="small" color="textTertiary">
            {goalLabel}
          </AppText>
        ) : null}
        {note ? (
          <AppText variant="caption" color="textSecondary" numberOfLines={2}>
            {note}
          </AppText>
        ) : null}
      </View>
      <View style={styles.right}>
        <AppText variant="subheading">
          {value}{' '}
          <AppText variant="caption" color="textSecondary">
            {unit}
          </AppText>
        </AppText>
        {change ? (
          <View style={styles.change}>
            {changeValue && Math.abs(changeValue) >= 0.05 ? (
              <Ionicons
                name={changeValue < 0 ? 'arrow-down' : 'arrow-up'}
                size={12}
                color={changeTone ? colors[`${changeTone}Text`] : colors.textTertiary}
              />
            ) : null}
            <AppText variant="small" color={changeTone ? `${changeTone}Text` : 'textTertiary'}>
              {change}
            </AppText>
          </View>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  left: {
    flex: 1,
    gap: 2,
  },
  right: {
    alignItems: 'flex-end',
  },
  change: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
});
