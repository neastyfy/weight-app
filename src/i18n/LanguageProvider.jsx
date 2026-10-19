// Язык интерфейса и перевод строк.
// Использование в компоненте:
//   const { t } = useTranslation();
//   t('tabs.home') → «Главная»
//   t('home.greeting', { name: 'Алекс' }) → «Привет, Алекс!»
// Выбранный язык сохраняется в базе и восстанавливается при запуске.
import { getLocales } from 'expo-localization';
import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { SETTING_KEYS, getSetting, setSetting } from '@/storage/settingsRepository';
import { logError } from '@/lib/logError';

import { FALLBACK_LANGUAGE, translations } from './languages';
import { createTranslator } from './translator';

const LanguageContext = createContext(null);

// Язык устройства, если приложение его поддерживает, иначе английский
function detectDeviceLanguage() {
  const deviceLanguage = getLocales()?.[0]?.languageCode;
  return translations[deviceLanguage] ? deviceLanguage : FALLBACK_LANGUAGE;
}

export function LanguageProvider({ children }) {
  const db = useSQLiteContext();
  const [language, setLanguageState] = useState(null);

  // Прочитать сохранённый язык (или язык устройства). Вызывается при запуске,
  // а также после удаления данных и восстановления из резервной копии.
  const reload = useCallback(async () => {
    try {
      const saved = await getSetting(db, SETTING_KEYS.language);
      setLanguageState(translations[saved] ? saved : detectDeviceLanguage());
    } catch (error) {
      logError('Не удалось загрузить язык', error);
      setLanguageState(detectDeviceLanguage());
    }
  }, [db]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Меняет язык сразу, а сохраняет в фоне (ошибка сохранения не мешает работе)
  const setLanguage = useCallback(
    (code) => {
      setLanguageState(code);
      setSetting(db, SETTING_KEYS.language, code).catch((error) => logError('Не удалось сохранить язык', error));
    },
    [db],
  );

  const t = useMemo(() => createTranslator(language ?? FALLBACK_LANGUAGE), [language]);

  // Ошибки проверки полей ({ key, params }) → текст. Единицы (kg, cm…) тоже переводятся.
  const translateError = useCallback(
    (error) => {
      if (!error) return undefined;
      const params = error.params?.unit ? { ...error.params, unit: t(`units.${error.params.unit}`) } : error.params;
      return t(error.key, params).trim();
    },
    [t],
  );

  const value = useMemo(
    () => ({ language, setLanguage, reload, t, translateError }),
    [language, setLanguage, reload, t, translateError],
  );

  // Пока язык загружается, ничего не показываем (это доли секунды)
  if (!language) return null;

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation нужно вызывать внутри LanguageProvider');
  }
  return context;
}
