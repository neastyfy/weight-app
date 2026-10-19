// Текущее время для экрана, который долго остаётся открытым (например, вкладка).
// Обновляется каждый раз, когда экран снова становится видимым, — чтобы «Сегодня»
// и «Вчера» не устаревали, если приложение было открыто через полночь.
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

export function useNow() {
  const [now, setNow] = useState(() => new Date());
  useFocusEffect(
    useCallback(() => {
      setNow(new Date());
    }, []),
  );
  return now;
}
