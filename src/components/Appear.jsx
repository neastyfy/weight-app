// Плавное пружинное появление содержимого при показе.
//   <Appear>…</Appear>                   — лёгкий подъём и проявление
//   <Appear variant="fade">…</Appear>    — только проявление
//   <Appear variant="pop">…</Appear>     — «выскакивает» с небольшим масштабом
//   <Appear delay={120}>…</Appear>       — с задержкой (мс)
// Чтобы проиграть анимацию заново, смените key у компонента.
//
// Почему не встроенные entering-анимации Reanimated: в браузере они временно
// вынимают элемент из потока вёрстки (position: absolute), и соседние блоки
// наезжают друг на друга. Этот компонент всегда остаётся на своём месте.
import { useEffect } from 'react';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';

import { springs } from '@/theme/motion';

const VARIANTS = {
  rise: { translateY: 12, scale: 1, spring: springs.move },
  fade: { translateY: 0, scale: 1, spring: springs.move },
  pop: { translateY: 0, scale: 0.6, spring: springs.pop },
};

export function Appear({ children, variant = 'rise', delay = 0, style }) {
  const config = VARIANTS[variant] ?? VARIANTS.rise;
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(delay, withSpring(1, config.spring));
  }, [progress, delay, config]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, progress.value * 1.4),
    transform: [
      { translateY: (1 - progress.value) * config.translateY },
      { scale: config.scale + (1 - config.scale) * progress.value },
    ],
  }));

  return <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>;
}
