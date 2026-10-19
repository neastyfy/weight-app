// Основа любого экрана: фон, безопасные зоны (вырез, «чёлка», панель Home), прокрутка
// и мягкое пружинное появление содержимого при открытии.
// Пример:
//   <Screen>
//     <ScreenHeader title="Графики" />
//     <Card>…</Card>
//   </Screen>
// withTabBar — экран находится во вкладке: снизу отступ уже даёт панель вкладок.
// pushed — вложенный экран (открыт поверх вкладок): в браузере въезжает справа, см. PageTransition.
// heroTop — шапка экрана сама заходит под «чёлку» (Главная): полоса под строкой состояния
// проявляется только при прокрутке. На остальных экранах полоса видна всегда (SafeAreaTopBand).
import { useRef } from 'react';
import { Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

import { Appear } from './Appear';
import { PageTransition } from './PageTransition';
import { SafeAreaTopBand } from './SafeAreaTopBand';

export function Screen({ children, scroll = true, withTabBar = false, pushed = false, heroTop = false, contentStyle }) {
  const { colors, spacing, layout } = useTheme();
  const insets = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;
  // Главная: полоса проявляется, пока содержимое уезжает под строку состояния
  const bandOpacity = heroTop
    ? scrollY.interpolate({ inputRange: [0, Math.max(1, insets.top)], outputRange: [0, 1], extrapolate: 'clamp' })
    : 1;

  const padding = {
    paddingTop: insets.top + spacing.md,
    paddingBottom: (withTabBar ? 0 : insets.bottom) + spacing.xxl,
    paddingHorizontal: layout.screenPadding,
    gap: spacing.lg,
  };

  const content = <Appear style={[{ gap: spacing.lg }, !scroll && { flex: 1 }]}>{children}</Appear>;

  let screen;
  if (!scroll) {
    screen = <View style={[{ flex: 1, backgroundColor: colors.background }, padding, contentStyle]}>{content}</View>;
  } else {
    screen = (
      <Animated.ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[padding, contentStyle]}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
        onScroll={heroTop ? Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], { useNativeDriver: true }) : undefined}
      >
        {content}
      </Animated.ScrollView>
    );
  }

  const withBand = (
    <>
      {screen}
      <SafeAreaTopBand opacity={bandOpacity} />
    </>
  );

  return pushed ? (
    <PageTransition style={{ backgroundColor: colors.background }}>{withBand}</PageTransition>
  ) : (
    <View style={{ flex: 1 }}>{withBand}</View>
  );
}
