// Тема приложения: светлая, тёмная или как в системе.
// Любой компонент получает тему через хук: const { colors, typography } = useTheme();
// Выбор пользователя (mode) сохраняется в базе и восстанавливается при запуске:
//   const { mode, setMode } = useTheme(); setMode('dark');
import { useSQLiteContext } from '@/storage/sqlite';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { SETTING_KEYS, getSetting, setSetting } from '@/storage/settingsRepository';
import { logError } from '@/lib/logError';

import { THEME_MODES } from './themeModes';
import { themes } from './themes';

export { THEME_MODES };

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const db = useSQLiteContext();
  const systemScheme = useColorScheme(); // 'light', 'dark' или null
  const [mode, setModeState] = useState(null); // null — ещё не загружено

  // Прочитать сохранённый режим (или «как в системе»). Вызывается при запуске,
  // а также после удаления данных и восстановления из резервной копии.
  const reload = useCallback(async () => {
    try {
      const saved = await getSetting(db, SETTING_KEYS.theme);
      setModeState(THEME_MODES.includes(saved) ? saved : 'system');
    } catch (error) {
      logError('Не удалось загрузить тему', error);
      setModeState('system');
    }
  }, [db]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Меняет тему сразу, а сохраняет в фоне
  const setMode = useCallback(
    (next) => {
      setModeState(next);
      setSetting(db, SETTING_KEYS.theme, next).catch((error) => logError('Не удалось сохранить тему', error));
    },
    [db],
  );

  const current = mode ?? 'system';
  const scheme = current === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : current;

  const value = useMemo(() => ({ ...themes[scheme], mode: current, setMode, reload }), [scheme, current, setMode, reload]);

  // Пока тема загружается, ничего не показываем (доли секунды) — чтобы не мигал другой цвет
  if (mode === null) return null;

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const theme = useContext(ThemeContext);
  if (!theme) {
    throw new Error('useTheme нужно вызывать внутри ThemeProvider');
  }
  return theme;
}
