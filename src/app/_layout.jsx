// Корень приложения: шрифты, база данных, язык, тема, профиль и навигация.
// Каждый файл в папке src/app — это экран (так работает Expo Router).
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider, Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { Suspense, useEffect, useMemo } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ErrorScreen, LoadingScreen } from '@/components';
import { GoalCelebration } from '@/features/goals/GoalCelebration';
import { MeasurementsProvider } from '@/features/measurements/MeasurementsProvider';
import { ProfileProvider, useProfile } from '@/features/profile';
import { WidgetSync } from '@/features/widget/WidgetSync';
import { LanguageProvider, useTranslation } from '@/i18n';
import { DATABASE_NAME, migrateDatabase } from '@/storage/database';
import { ThemeProvider, fontFiles, useTheme } from '@/theme';
import { isDatabaseBusyError, isDatabaseSupported, markDatabaseOpened, recoverFromBusyDatabase, reloadApp } from '@/lib/databaseLock';
import { logError } from '@/lib/logError';

// Если при запуске что-то сломалось (например, не открылась база) — экран с кнопкой «Повторить».
// В браузере база могла быть на миг занята закрывающейся страницей: тогда тихо перезагружаемся
// (см. src/lib/databaseLock.web.js), а если она занята надолго — объясняем, что делать.
export function ErrorBoundary({ error, retry }) {
  const busy = isDatabaseBusyError(error);
  const recovering = busy && recoverFromBusyDatabase();
  if (!recovering) logError('Ошибка запуска приложения', error);
  if (recovering) return <LoadingScreen />;
  return <ErrorScreen onRetry={reloadApp ?? retry} reason={busy ? 'busy' : null} />;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontFiles);

  // Браузер не может запустить базу (нет изоляции страницы) — честный экран вместо вечной загрузки
  if (!isDatabaseSupported()) {
    return <ErrorScreen onRetry={reloadApp} reason="unsupported" />;
  }

  if (!fontsLoaded) {
    return <LoadingScreen />;
  }

  return (
    // Корень для жестов (перетаскивание шкал)
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Suspense fallback={<LoadingScreen />}>
        {/* База открывается и обновляется (миграции) до показа приложения */}
        <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDatabase} useSuspense>
          <LanguageProvider>
            <ThemeProvider>
              <MeasurementsProvider>
                <ProfileProvider>
                  <AppNavigator />
                </ProfileProvider>
              </MeasurementsProvider>
            </ThemeProvider>
          </LanguageProvider>
        </SQLiteProvider>
      </Suspense>
    </GestureHandlerRootView>
  );
}

function AppNavigator() {
  const { colors, isDark, layout } = useTheme();
  const { language } = useTranslation();
  const { status, profile, reload } = useProfile();

  // База открылась (иначе мы бы сюда не попали) — сбросить счётчик тихих перезагрузок
  useEffect(() => {
    markDatabaseOpened();
  }, []);

  // Передаём наши цвета навигации, чтобы фон при переходах совпадал с темой
  const navigationTheme = useMemo(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.tabBar,
        text: colors.text,
        border: colors.border,
      },
    };
  }, [colors, isDark]);

  if (status === 'error') {
    return <ErrorScreen onRetry={reload} language={language} />;
  }
  // Первая загрузка профиля (при повторной загрузке экран не мигает)
  if (status === 'loading' && !profile) {
    return <LoadingScreen />;
  }

  const hasProfile = Boolean(profile);

  return (
    <NavigationThemeProvider value={navigationTheme}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {/* В широком окне браузера приложение остаётся «телефонной» ширины */}
        <View style={{ flex: 1, width: '100%', maxWidth: layout.maxContentWidth, alignSelf: 'center' }}>
          <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
            {/* Профиль есть — доступно приложение */}
            <Stack.Protected guard={hasProfile}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="goal/edit" />
              <Stack.Screen name="metrics" />
              <Stack.Screen name="settings/index" />
              <Stack.Screen name="settings/language" />
              <Stack.Screen name="settings/data" />
              <Stack.Screen name="settings/profile/[field]" />
              <Stack.Screen name="weight/index" />
              <Stack.Screen name="weight/new" />
              <Stack.Screen name="weight/[id]" />
              <Stack.Screen name="body/index" />
              <Stack.Screen name="body/[type]/index" />
              <Stack.Screen name="body/[type]/new" />
              <Stack.Screen name="body/entry/[id]" />
            </Stack.Protected>
            {/* Витрина дизайн-системы — только в режиме разработки */}
            <Stack.Protected guard={hasProfile && __DEV__}>
              <Stack.Screen name="design-preview" />
            </Stack.Protected>
            {/* Профиля нет — доступен только онбординг */}
            <Stack.Protected guard={!hasProfile}>
              <Stack.Screen name="onboarding" />
            </Stack.Protected>
          </Stack>
        </View>
      </View>
      {/* Поздравление с достижением цели — поверх любого экрана */}
      {hasProfile ? <GoalCelebration /> : null}
      {/* Снимок для iOS-виджета и язык напоминаний — в фоне, ничего не рисует */}
      <WidgetSync />
      <StatusBar style={isDark ? 'light' : 'dark'} />
    </NavigationThemeProvider>
  );
}
