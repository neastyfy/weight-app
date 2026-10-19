// Светлая и тёмная темы: объединяют цвета, типографику, отступы и тени.
import { darkColors, lightColors } from './colors';
import { layout, radius, spacing } from './spacing';
import { typography } from './typography';

function buildTheme(scheme, colors) {
  return {
    scheme, // 'light' или 'dark'
    isDark: scheme === 'dark',
    colors,
    typography,
    spacing,
    radius,
    layout,
    // Мягкие тени, как у карточек в референсе
    shadows: {
      card: { boxShadow: `0px 6px 20px ${colors.shadow}` },
      raised: { boxShadow: `0px 2px 8px ${colors.shadow}` },
    },
  };
}

export const themes = {
  light: buildTheme('light', lightColors),
  dark: buildTheme('dark', darkColors),
};
