// Цветная шкала с отметкой текущего значения (как шкала ИМТ в референсе):
// сразу видно, в какой зоне находится показатель.
//
//   <RangeScale
//     segments={[{ size: 3.5, tone: 'warning' }, { size: 6.5, tone: 'success' }]} // доли и цвета зон
//     position={0.42}                     // где стоит отметка: от 0 до 1
//     labels={[{ at: 0.35, text: '18,5' }]} // необязательные подписи границ
//     compact                             // тонкая версия для маленьких карточек
//   />
// Цвета зон — ключи из темы: success, caution, warning, error…
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useTheme } from '@/theme';
import { springs } from '@/theme/motion';

import { AppText } from './AppText';

export function RangeScale({ segments, position, labels, compact = false, style }) {
  const { colors, radius } = useTheme();
  const [width, setWidth] = useState(0);

  const barHeight = compact ? 6 : 10;
  const markerSize = compact ? 14 : 20;
  const clamped = Math.min(1, Math.max(0, position ?? 0));

  // Отметка переезжает к новому значению на пружине
  const animated = useSharedValue(clamped);
  useEffect(() => {
    animated.value = withSpring(clamped, springs.move);
  }, [animated, clamped]);

  const markerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: animated.value * width - markerSize / 2 }],
  }));

  // Цвет отметки — цвет зоны, в которой она стоит
  const total = segments.reduce((sum, segment) => sum + segment.size, 0);
  let accumulated = 0;
  const activeSegment =
    segments.find((segment) => {
      accumulated += segment.size;
      return clamped * total <= accumulated + 1e-9;
    }) ?? segments[segments.length - 1];

  return (
    <View style={style}>
      <View
        onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
        style={[styles.bar, { height: markerSize, gap: 3 }]}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {segments.map((segment, index) => (
          <View
            key={index}
            style={{
              flex: segment.size,
              height: barHeight,
              backgroundColor: colors[segment.tone],
              opacity: segment === activeSegment ? 1 : 0.35,
              borderTopLeftRadius: index === 0 ? radius.pill : 2,
              borderBottomLeftRadius: index === 0 ? radius.pill : 2,
              borderTopRightRadius: index === segments.length - 1 ? radius.pill : 2,
              borderBottomRightRadius: index === segments.length - 1 ? radius.pill : 2,
            }}
          />
        ))}
        {width > 0 && position != null ? (
          <Animated.View
            style={[
              styles.marker,
              {
                width: markerSize,
                height: markerSize,
                borderRadius: markerSize / 2,
                borderWidth: compact ? 3 : 4,
                borderColor: colors[activeSegment.tone],
                backgroundColor: colors.surface,
              },
              markerStyle,
            ]}
          />
        ) : null}
      </View>

      {labels?.length && width > 0 ? (
        <View style={styles.labels}>
          {labels.map((label) => (
            <AppText
              key={label.text}
              variant="small"
              color="textTertiary"
              style={[styles.label, { left: label.at * width - 20 }]}
            >
              {label.text}
            </AppText>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marker: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  labels: {
    height: 18,
    marginTop: 2,
  },
  label: {
    position: 'absolute',
    width: 40,
    textAlign: 'center',
  },
});
