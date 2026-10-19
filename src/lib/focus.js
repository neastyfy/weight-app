// Нужно ли показывать кольцо фокуса.
// В браузере фокус приходит и от щелчка мышью — тогда кольцо не нужно.
// Показываем его только при навигации с клавиатуры (Tab), как это делает сам браузер (:focus-visible).
import { Platform } from 'react-native';

export function isFocusVisible(event) {
  if (Platform.OS !== 'web') return true;
  const target = event?.target ?? event?.nativeEvent?.target;
  try {
    return Boolean(target?.matches?.(':focus-visible'));
  } catch {
    return false;
  }
}
