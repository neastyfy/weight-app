// ТОЛЬКО ДЛЯ БРАУЗЕРА (на iOS — AppSafeArea.jsx).
//
// В браузере провайдер Expo Router всегда отдаёт нулевые отступы, и в PWA на iPhone
// приложение заезжало под «чёлку». Здесь измеряем настоящие (env(safe-area-inset-*)),
// но используем только верхний: снизу панель вкладок и кнопки остаются на своём месте,
// без лишнего подъёма над полоской Home.
import { createContext, useContext } from 'react';
import { SafeAreaInsetsContext, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

// Настоящий нижний отступ экрана (для панели вкладок)
const DeviceBottomInsetContext = createContext(0);

export function AppSafeArea({ children }) {
  return (
    <SafeAreaProvider>
      <TopInsetOnly>{children}</TopInsetOnly>
    </SafeAreaProvider>
  );
}

function TopInsetOnly({ children }) {
  const insets = useSafeAreaInsets();
  return (
    <DeviceBottomInsetContext value={insets.bottom}>
      <SafeAreaInsetsContext.Provider value={{ ...insets, bottom: 0 }}>{children}</SafeAreaInsetsContext.Provider>
    </DeviceBottomInsetContext>
  );
}

// Отступы нижней панели вкладок. На iPhone с закруглёнными углами экрана (есть нижняя безопасная зона)
// панель чуть приподнимает подписи и отодвигает крайние вкладки от скруглений —
// но не на всю безопасную зону, иначе панель выглядит высокой.
export function useTabBarInsets() {
  const deviceBottom = useContext(DeviceBottomInsetContext);
  if (deviceBottom === 0) return { bottom: 0, horizontal: 0 };
  return { bottom: Math.round(deviceBottom * 0.4), horizontal: 12 };
}
