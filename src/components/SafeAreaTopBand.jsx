// Полоса цвета фона под «чёлкой» и строкой состояния — поверх прокручиваемого содержимого,
// чтобы при прокрутке текст не уезжал под часы и вырез.
// opacity — необязательное Animated-значение (на Главной полоса проявляется при прокрутке,
// а в начале под чёлкой видна картинка шапки).
import { Animated, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

export function SafeAreaTopBand({ opacity = 1 }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  if (insets.top === 0) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.band, { height: insets.top, backgroundColor: colors.background, opacity }]}
    />
  );
}

const styles = StyleSheet.create({
  band: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10 },
});
