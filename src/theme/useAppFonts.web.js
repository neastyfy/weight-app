// ТОЛЬКО ДЛЯ БРАУЗЕРА (на iOS — useAppFonts.js).
//
// expo-font в браузере ждёт document.fonts.load(), а Safari (и все браузеры на iPhone) этот
// промис для только что добавленных шрифтов иногда не выполняет никогда — тогда через 12 секунд
// expo-font сообщает об ошибке. Поэтому ждём шрифты не дольше FONT_WAIT_MS: правила @font-face
// к этому моменту уже добавлены, и браузер сам подменит шрифт, как только файл скачается.
import { loadAsync } from 'expo-font';
import { useEffect, useState } from 'react';

import { fontFiles } from './fonts';

const FONT_WAIT_MS = 1500;

export function useAppFonts() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const finish = () => setReady(true);
    loadAsync(fontFiles).then(finish, finish);
    const timer = setTimeout(finish, FONT_WAIT_MS);
    return () => clearTimeout(timer);
  }, []);

  return ready;
}
