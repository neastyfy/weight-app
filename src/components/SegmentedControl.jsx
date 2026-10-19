// Переключатель из нескольких вариантов (как «Неделя / Месяц / Год» в референсе).
// Выбранный вариант подсвечивается «ползунком», который переезжает с пружиной.
// Пример:
//   <SegmentedControl
//     options={[{ value: 'week', label: 'Неделя' }, { value: 'month', label: 'Месяц' }]}
//     value={period}
//     onChange={setPeriod}
//   />
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';

import { isFocusVisible } from '@/lib/focus';
import { useTheme } from '@/theme';
import { springs } from '@/theme/motion';

import { AppText } from './AppText';

const PADDING = 4;

export function SegmentedControl({ options, value, onChange, style }) {
  const { colors, radius, spacing, shadows } = useTheme();
  const [trackWidth, setTrackWidth] = useState(0);
  const [keyboardFocus, setKeyboardFocus] = useState(null); // вариант с фокусом от клавиатуры

  const selectedIndex = Math.max(0, options.findIndex((option) => option.value === value));
  const segmentWidth = trackWidth > 0 ? (trackWidth - PADDING * 2) / options.length : 0;

  const position = useSharedValue(selectedIndex);
  const squash = useSharedValue(1);
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false; // при первом показе — без анимации
      return;
    }
    // Ползунок плавно переезжает без перелёта, а сам делает лёгкий «щелчок», как при нажатии
    position.value = withSpring(selectedIndex, springs.glide);
    squash.value = withSequence(withSpring(0.93, springs.press), withSpring(1, springs.pop));
  }, [position, squash, selectedIndex]);

  const indicatorStyle = useAnimatedStyle(() => ({
    width: segmentWidth,
    transform: [{ translateX: position.value * segmentWidth }, { scale: squash.value }],
  }));

  return (
    <View
      accessibilityRole="tablist"
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      style={[styles.track, { backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: PADDING }, style]}
    >
      {segmentWidth > 0 ? (
        <Animated.View
          style={[
            styles.indicator,
            { top: PADDING, bottom: PADDING, left: PADDING, borderRadius: radius.sm, backgroundColor: colors.surfaceRaised },
            shadows.raised,
            indicatorStyle,
          ]}
        />
      ) : null}

      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            onFocus={(event) => setKeyboardFocus(isFocusVisible(event) ? option.value : null)}
            onBlur={() => setKeyboardFocus(null)}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            style={({ pressed }) => [
              styles.segment,
              { borderRadius: radius.sm, paddingVertical: spacing.xs },
              pressed && !selected && { opacity: 0.6 },
              keyboardFocus === option.value && { boxShadow: `0px 0px 0px 3px ${colors.focusRing}` },
            ]}
          >
            <AppText variant="small" color={selected ? 'text' : 'textSecondary'} numberOfLines={1}>
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
  },
  indicator: {
    position: 'absolute',
  },
  segment: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
});
