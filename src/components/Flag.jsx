// Флаг языка — векторный рисунок (одинаково выглядит на iOS и в браузере:
// эмодзи-флаги в Windows показываются буквами).
// Пример: <Flag code="uk" size={28} />  — code: код языка приложения (en, uk, ru, pl, cs, kk, de)
// Чтобы добавить флаг: допишите рисунок в FLAGS (viewBox 3:2).
import Svg, { Circle, G, Line, Path, Polygon, Rect } from 'react-native-svg';
import { View } from 'react-native';

import { useTheme } from '@/theme';

// Рисунки флагов в координатах 0…60 × 0…40 (пропорция 3:2)
const FLAGS = {
  // Английский — флаг Великобритании (упрощённый Union Jack)
  en: (
    <G>
      <Rect width="60" height="40" fill="#012169" />
      <Path d="M0,0 L60,40 M60,0 L0,40" stroke="#FFFFFF" strokeWidth="8" />
      <Path d="M0,0 L60,40 M60,0 L0,40" stroke="#C8102E" strokeWidth="3" />
      <Path d="M30,0 V40 M0,20 H60" stroke="#FFFFFF" strokeWidth="12" />
      <Path d="M30,0 V40 M0,20 H60" stroke="#C8102E" strokeWidth="7" />
    </G>
  ),
  // Украинский
  uk: (
    <G>
      <Rect width="60" height="20" fill="#0057B7" />
      <Rect y="20" width="60" height="20" fill="#FFD700" />
    </G>
  ),
  // Русский — бело-сине-белый флаг
  ru: (
    <G>
      <Rect width="60" height="40" fill="#FFFFFF" />
      <Rect y="13.33" width="60" height="13.34" fill="#1F5BB5" />
    </G>
  ),
  // Польский
  pl: (
    <G>
      <Rect width="60" height="20" fill="#FFFFFF" />
      <Rect y="20" width="60" height="20" fill="#DC143C" />
    </G>
  ),
  // Чешский
  cs: (
    <G>
      <Rect width="60" height="20" fill="#FFFFFF" />
      <Rect y="20" width="60" height="20" fill="#D7141A" />
      <Polygon points="0,0 30,20 0,40" fill="#11457E" />
    </G>
  ),
  // Казахский — голубое поле, солнце с лучами и орнамент у древка (упрощённо)
  kk: (
    <G>
      <Rect width="60" height="40" fill="#00AFCA" />
      <G stroke="#FEC50C" strokeWidth="1.2" strokeLinecap="round">
        {Array.from({ length: 16 }, (_, i) => {
          const angle = (i / 16) * Math.PI * 2;
          return (
            <Line
              key={i}
              x1={32 + Math.cos(angle) * 7.5}
              y1={17 + Math.sin(angle) * 7.5}
              x2={32 + Math.cos(angle) * 10}
              y2={17 + Math.sin(angle) * 10}
            />
          );
        })}
      </G>
      <Circle cx="32" cy="17" r="5.5" fill="#FEC50C" />
      <Path d="M24,30 Q32,26 40,30" stroke="#FEC50C" strokeWidth="1.6" fill="none" />
      <Rect x="4" y="3" width="3" height="34" fill="#FEC50C" opacity="0.9" />
    </G>
  ),
  // Немецкий
  de: (
    <G>
      <Rect width="60" height="13.34" fill="#000000" />
      <Rect y="13.33" width="60" height="13.34" fill="#DD0000" />
      <Rect y="26.66" width="60" height="13.34" fill="#FFCE00" />
    </G>
  ),
};

export function Flag({ code, size = 28 }) {
  const { colors } = useTheme();
  const width = size;
  const height = Math.round((size * 2) / 3);
  const art = FLAGS[code];
  if (!art) return null;

  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width,
        height,
        borderRadius: Math.max(3, size / 8),
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: colors.border, // видно край у светлых флагов
      }}
    >
      <Svg width="100%" height="100%" viewBox="0 0 60 40" preserveAspectRatio="xMidYMid slice">
        {art}
      </Svg>
    </View>
  );
}
