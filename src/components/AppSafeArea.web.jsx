// ТОЛЬКО ДЛЯ БРАУЗЕРА (на iOS — AppSafeArea.jsx).
//
// В браузере провайдер Expo Router всегда отдаёт нулевые отступы, и в PWA на iPhone
// приложение заезжало под «чёлку». Здесь измеряем настоящие (env(safe-area-inset-*)),
// но используем только верхний: снизу панель вкладок и кнопки остаются на своём месте,
// без лишнего подъёма над полоской Home.
import { SafeAreaInsetsContext, SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

export function AppSafeArea({ children }) {
  return (
    <SafeAreaProvider>
      <TopInsetOnly>{children}</TopInsetOnly>
    </SafeAreaProvider>
  );
}

function TopInsetOnly({ children }) {
  const insets = useSafeAreaInsets();
  return <SafeAreaInsetsContext.Provider value={{ ...insets, bottom: 0 }}>{children}</SafeAreaInsetsContext.Provider>;
}
