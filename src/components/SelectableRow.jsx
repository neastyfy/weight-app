// Строка выбора варианта: один из списка (type="radio") или несколько (type="checkbox").
// Пример: <SelectableRow label="Мужской" selected={sex === 'male'} onPress={() => setSex('male')} />
// leading — свой элемент слева вместо иконки (например, флаг)
import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { Appear } from './Appear';
import { IconBadge } from './IconBadge';
import { PressableScale } from './PressableScale';

export function SelectableRow({ label, description, icon, iconTone, leading, selected, onPress, type = 'radio' }) {
  const { colors, radius, spacing } = useTheme();
  const isCheckbox = type === 'checkbox';

  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.98}
      accessibilityRole={isCheckbox ? 'checkbox' : 'radio'}
      accessibilityState={{ checked: selected }}
      style={({ focused }) => [
        styles.row,
        {
          gap: spacing.sm,
          padding: spacing.md,
          borderRadius: radius.md,
          backgroundColor: selected ? colors.primarySoft : colors.surface,
          borderColor: selected ? colors.primary : colors.border,
        },
        focused && { boxShadow: `0px 0px 0px 3px ${colors.focusRing}` },
      ]}
    >
      {leading ?? (icon ? <IconBadge icon={icon} tone={iconTone} size={36} /> : null)}

      <View style={styles.texts}>
        <AppText variant="subheading">{label}</AppText>
        {description ? (
          <AppText variant="caption" color="textSecondary">
            {description}
          </AppText>
        ) : null}
      </View>

      <SelectionIndicator selected={selected} round={!isCheckbox} />
    </PressableScale>
  );
}

// Индикатор выбора: кружок (radio) или квадрат (checkbox) с галочкой
export function SelectionIndicator({ selected, round = true, size = 24 }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: round ? size / 2 : 7,
        borderWidth: 2,
        borderColor: selected ? colors.primary : colors.textTertiary,
        backgroundColor: selected ? colors.primary : 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {selected ? (
        // Галочка «выскакивает» с лёгким пружинным подскоком
        <Appear variant="pop">
          <Ionicons name="checkmark" size={size * 0.66} color={colors.textOnPrimary} />
        </Appear>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  texts: {
    flex: 1,
    gap: 2,
  },
});
