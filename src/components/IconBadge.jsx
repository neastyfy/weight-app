// Иконка на пастельной плашке (как у показателей и пунктов списка в референсе).
// tone: 'primary' | 'success' | 'pink' | 'warning' | 'purple'
// Иконки: https://icons.expo.fyi (набор Ionicons)
// Пример: <IconBadge icon="flame" tone="warning" />
import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';

import { useTheme } from '@/theme';

// Для каждого тона: [цвет фона, цвет иконки] — ключи из цветов темы
const TONES = {
  primary: ['primarySoft', 'primary'],
  success: ['successSoft', 'success'],
  pink: ['pinkSoft', 'pinkText'],
  warning: ['warningSoft', 'warning'],
  purple: ['purpleSoft', 'purple'],
};

export function IconBadge({ icon, tone = 'primary', size = 44 }) {
  const { colors, radius } = useTheme();
  const [background, foreground] = TONES[tone] ?? TONES.primary;

  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius.md,
        backgroundColor: colors[background],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={size * 0.5} color={colors[foreground]} />
    </View>
  );
}
