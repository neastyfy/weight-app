// Полоса прогресса с плавным пружинным заполнением. progress — от 0 до 1.
// Пример: <ProgressBar progress={0.4} color="success" />
// gradient — ключ градиента темы (например, 'successGradient'): заливка переливается слева направо.
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useTheme } from '@/theme';
import { springs } from '@/theme/motion';

export function ProgressBar({ progress, color = 'primary', gradient, height = 6, style }) {
  const { colors, radius } = useTheme();
  const clamped = Math.min(1, Math.max(0, progress));

  const fill = useSharedValue(clamped);
  useEffect(() => {
    fill.value = withSpring(clamped, springs.move);
  }, [fill, clamped]);

  const fillStyle = useAnimatedStyle(() => ({ width: `${fill.value * 100}%` }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
      style={[{ height, borderRadius: radius.pill, backgroundColor: colors.surfaceMuted, overflow: 'hidden' }, style]}
    >
      <Animated.View
        style={[{ height: '100%', borderRadius: radius.pill, overflow: 'hidden', backgroundColor: gradient ? undefined : colors[color] }, fillStyle]}
      >
        {gradient ? (
          <LinearGradient colors={colors[gradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
        ) : null}
      </Animated.View>
    </View>
  );
}
