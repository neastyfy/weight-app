// Мотивирующая фраза для Главной: при каждом запуске — другая, чем в прошлый раз.
// Номер последней фразы хранится в настройках. Тексты — в переводах: motivation.p1 … p8.
import { useSQLiteContext } from 'expo-sqlite';
import { useEffect, useState } from 'react';

import { useTranslation } from '@/i18n';
import { SETTING_KEYS, getSetting, setSetting } from '@/storage/settingsRepository';

import { pickPhraseIndex } from './homeModel';

// Сколько фраз в переводах (motivation.p1 … p8). Добавил фразу — увеличь число.
const PHRASE_COUNT = 8;

export function useMotivationPhrase() {
  const db = useSQLiteContext();
  const { t } = useTranslation();
  const [index, setIndex] = useState(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      let previous = null;
      try {
        const saved = await getSetting(db, SETTING_KEYS.motivationIndex);
        previous = saved == null ? null : Number(saved);
      } catch {
        // без прошлого номера фраза просто выберется случайно
      }
      const next = pickPhraseIndex(PHRASE_COUNT, previous);
      if (cancelled) return;
      setIndex(next);
      setSetting(db, SETTING_KEYS.motivationIndex, next).catch(() => {});
    })();
    return () => {
      cancelled = true;
    };
  }, [db]);

  return index == null ? null : t(`motivation.p${index + 1}`);
}
