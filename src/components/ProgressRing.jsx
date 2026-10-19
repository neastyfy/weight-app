// Кольцо прогресса (как «62 %» на экране цели в референсе). progress — от 0 до 1.
// Пример: <ProgressRing progress={0.62} size={120} label="62 %" />
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { useTheme } from '@/theme';

import { AppText } from './AppText';

export function ProgressRing({ progress, size = 120, stroke = 12, color = 'success', label }) {
  const { colors } = useTheme();
  const clamped = Math.min(1, Math.max(0, progress ?? 0));
  const radius = (size - stroke) / 2;
  const length = 2 * Math.PI * radius;
  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped * 100) }}
    >
      <Svg width={size} height={size} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={colors.surfaceMuted} strokeWidth={stroke} fill="none" />
        {clamped > 0 ? (
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={colors[color]}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${length * clamped} ${length}`}
          />
        ) : null}
      </Svg>
      {label ? <AppText variant="heading">{label}</AppText> : null}
    </View>
  );
}
