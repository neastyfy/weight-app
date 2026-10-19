// Кнопка с пружинной реакцией на нажатие.
// variant: 'primary' — основная (синий градиент), 'secondary' — светлая, 'text' — как ссылка.
// Пример: <Button title="Далее" icon="arrow-forward" onPress={…} />
// textColor — свой цвет текста (например, красный для «Удалить»)
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

export function Button({ title, onPress, variant = 'primary', icon, disabled = false, style, textColor: customTextColor }) {
  const { colors, radius, layout, spacing } = useTheme();

  const textColor = disabled
    ? colors.disabledText
    : customTextColor
      ? customTextColor
      : variant === 'primary'
      ? colors.textOnPrimary
      : colors.primary;

  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      style={({ pressed, focused }) => [
        styles.base,
        { height: layout.buttonHeight, borderRadius: radius.pill },
        variant === 'secondary' && { backgroundColor: disabled ? colors.disabled : colors.primarySoft },
        variant === 'primary' && disabled && { backgroundColor: colors.disabled },
        pressed && { opacity: 0.9 },
        // Кольцо фокуса при навигации с клавиатуры (Web)
        focused && { boxShadow: `0px 0px 0px 4px ${colors.focusRing}` },
        style,
      ]}
    >
      {variant === 'primary' && !disabled ? (
        <LinearGradient
          colors={colors.primaryGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.pill }]}
        />
      ) : null}
      <View style={[styles.content, { gap: spacing.xs }]}>
        <AppText variant="subheading" color={textColor}>
          {title}
        </AppText>
        {icon ? <Ionicons name={icon} size={20} color={textColor} /> : null}
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    paddingHorizontal: 24,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
