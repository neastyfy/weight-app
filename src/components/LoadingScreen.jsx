// Экран загрузки. Не использует тему и переводы — может показываться до их загрузки.
import { ActivityIndicator, View } from 'react-native';

import { themes } from '@/theme/themes';

export function LoadingScreen() {
  const { colors } = themes.light;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
