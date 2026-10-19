// Въезд вложенного экрана (история, формы, детали) — плавно справа на пружине.
//
// На iOS переход между экранами анимирует сама система (native stack), поэтому
// там компонент ничего не делает. В браузере стандартная навигация экраны не
// анимирует — этот компонент добавляет мягкий въезд и проявление.
// Пример: <PageTransition>…содержимое экрана…</PageTransition>
import { useEffect } from 'react';
import { Platform, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { springs } from '@/theme/motion';

const OFFSET = 36; // px: откуда въезжает экран

export function PageTransition({ children, style }) {
  if (Platform.OS !== 'web') {
    return <View style={[{ flex: 1 }, style]}>{children}</View>;
  }
  return <WebPageTransition style={style}>{children}</WebPageTransition>;
}

function WebPageTransition({ children, style }) {
  const progress = useSharedValue(0);
  useEffect(() => {
    progress.value = withSpring(1, springs.move);
  }, [progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, progress.value * 1.3),
    transform: [{ translateX: (1 - progress.value) * OFFSET }],
  }));

  // Внешний контейнер обрезает въезжающий экран: иначе браузер на миг расширяет страницу
  // на величину сдвига, и всплывающие окна центрируются со смещением
  return (
    <View style={[{ flex: 1, overflow: 'hidden' }, style]}>
      <Animated.View style={[{ flex: 1 }, animatedStyle]}>{children}</Animated.View>
    </View>
  );
}
