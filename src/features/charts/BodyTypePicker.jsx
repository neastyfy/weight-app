// Выбор вида окружности — горизонтальный ряд «таблеток» (талия, ягодицы, грудь, …).
import { ScrollView } from 'react-native';

import { AppText, PressableScale } from '@/components';
import { BODY_MEASUREMENT_TYPES } from '@/features/measurements/measurementModel';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme';

export function BodyTypePicker({ value, onChange }) {
  const { t } = useTranslation();
  const { colors, radius, spacing, layout } = useTheme();

  return (
    // Ряд прокручивается до самого края экрана, а не обрезается по отступу
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ marginHorizontal: -layout.screenPadding }}
      contentContainerStyle={{ gap: spacing.xs, paddingHorizontal: layout.screenPadding }}
    >
      {BODY_MEASUREMENT_TYPES.map((type) => {
        const selected = type.id === value;
        return (
          <PressableScale
            key={type.id}
            onPress={() => onChange(type.id)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            style={{
              paddingHorizontal: spacing.md,
              paddingVertical: spacing.xs,
              borderRadius: radius.pill,
              backgroundColor: selected ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor: selected ? colors.primary : colors.border,
            }}
          >
            <AppText variant="small" color={selected ? 'textOnPrimary' : 'textSecondary'}>
              {t(`body.types.${type.id}`)}
            </AppText>
          </PressableScale>
        );
      })}
    </ScrollView>
  );
}
