// Передача снимка iOS-виджету через общее хранилище App Group (UserDefaults).
// Виджет (targets/weight-widget) читает тот же ключ. Для других платформ — widgetStorage.js.
//
// Важно: обновлением виджета управляет iOS. reloadWidget() только просит систему
// перерисовать виджет — обычно это происходит быстро, но мгновенность не гарантируется.
// В Expo Go нативного модуля нет: запись тихо пропускается (виджет работает только в сборке приложения).
import { ExtensionStorage } from '@bacons/apple-targets';

import { logError } from '@/lib/logError';

import { WIDGET_APP_GROUP, WIDGET_SNAPSHOT_KEY } from './widgetConfig';

const storage = new ExtensionStorage(WIDGET_APP_GROUP);

export const WIDGET_SUPPORTED = true;

// Сохранить снимок (объект из buildWidgetSnapshot) или удалить его (null)
export function writeWidgetSnapshot(snapshot) {
  try {
    if (snapshot) storage.set(WIDGET_SNAPSHOT_KEY, JSON.stringify(snapshot));
    else storage.remove(WIDGET_SNAPSHOT_KEY);
    ExtensionStorage.reloadWidget();
  } catch (error) {
    logError('Не удалось обновить данные виджета', error);
  }
}
