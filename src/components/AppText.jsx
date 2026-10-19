// Текст приложения. Всегда используйте его вместо <Text> из react-native,
// чтобы шрифт, размер и цвет брались из дизайн-системы.
// Пример: <AppText variant="heading" color="textSecondary">Заголовок</AppText>
import { Text } from 'react-native';

import { useTheme } from '@/theme';

export function AppText({ variant = 'body', color = 'text', align, style, children, ...rest }) {
  const { colors, typography } = useTheme();

  return (
    <Text
      // Учитываем системный размер шрифта iOS, но не даём тексту разрастись до поломки вёрстки
      maxFontSizeMultiplier={1.5}
      style={[typography[variant], { color: colors[color] ?? color, textAlign: align }, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}
