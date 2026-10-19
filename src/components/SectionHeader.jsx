// Заголовок раздела экрана со ссылкой справа («Подробнее», «Вся история»).
// Пример: <SectionHeader title="Последние измерения" linkLabel="Вся история" onLinkPress={…} />
import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

export function SectionHeader({ title, linkLabel, onLinkPress }) {
  const { colors, spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm }}>
      <AppText variant="heading" accessibilityRole="header" style={{ flexShrink: 1 }}>
        {title}
      </AppText>
      {linkLabel ? (
        <PressableScale
          onPress={onLinkPress}
          accessibilityRole="link"
          hitSlop={8}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}
        >
          <AppText variant="small" color="primary">
            {linkLabel}
          </AppText>
          <Ionicons name="chevron-forward" size={14} color={colors.primary} />
        </PressableScale>
      ) : null}
    </View>
  );
}
