// Карточка — белый (в тёмной теме — тёмно-синий) блок со скруглением и мягкой тенью.
// Пример: <Card><AppText>…</AppText></Card>
import { View } from 'react-native';

import { useTheme } from '@/theme';

export function Card({ children, style }) {
  const { colors, radius, spacing, shadows } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.surface,
          borderRadius: radius.lg,
          padding: spacing.lg,
          gap: spacing.sm,
        },
        shadows.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}
