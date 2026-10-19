// Строка списка: иконка, заголовок и подпись слева, значение и стрелка справа.
// Пример: <ListRow icon="scale-outline" title="История веса" value="12" onPress={…} />
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { IconBadge } from './IconBadge';
import { PressableScale } from './PressableScale';

export function ListRow({ icon, iconTone = 'primary', title, subtitle, value, valueCaption, onPress, divider = false }) {
  const { colors, spacing } = useTheme();
  const content = (
    <>
      {icon ? <IconBadge icon={icon} tone={iconTone} size={40} /> : null}
      <View style={styles.texts}>
        <AppText variant="subheading" numberOfLines={1}>
          {title}
        </AppText>
        {subtitle ? (
          <AppText variant="caption" color="textSecondary" numberOfLines={2}>
            {subtitle}
          </AppText>
        ) : null}
      </View>
      {value != null ? (
        <View style={styles.value}>
          <AppText variant="subheading">{value}</AppText>
          {valueCaption ? (
            <AppText variant="small" color="textTertiary">
              {valueCaption}
            </AppText>
          ) : null}
        </View>
      ) : null}
      {onPress ? <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} /> : null}
    </>
  );

  const rowStyle = [
    styles.row,
    { gap: spacing.sm, paddingVertical: spacing.sm },
    divider && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  ];

  if (!onPress) return <View style={rowStyle}>{content}</View>;
  return (
    <PressableScale onPress={onPress} scaleTo={0.98} accessibilityRole="button" style={rowStyle}>
      {content}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  texts: {
    flex: 1,
    gap: 2,
  },
  value: {
    alignItems: 'flex-end',
  },
});
