// Загрузка шрифтов приложения при старте. Возвращает true, когда можно показывать интерфейс.
// Версия для браузера — useAppFonts.web.js.
import { useFonts } from 'expo-font';

import { fontFiles } from './fonts';

export function useAppFonts() {
  const [loaded, error] = useFonts(fontFiles);
  // Шрифт не загрузился — показываем приложение системным шрифтом, а не вечную загрузку
  return loaded || Boolean(error);
}
