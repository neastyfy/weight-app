// Безопасные зоны экрана. На iOS их правильно даёт Expo Router — ничего не меняем.
// Версия для браузера (PWA) — AppSafeArea.web.jsx.
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export function AppSafeArea({ children }) {
  return children;
}

// Отступы нижней панели вкладок: на iOS — обычная нижняя безопасная зона
export function useTabBarInsets() {
  const insets = useSafeAreaInsets();
  return { bottom: insets.bottom, horizontal: 0 };
}
