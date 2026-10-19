// Время суток для фона Главной: 'day' или 'night' (см. getTimeOfDay в реестре маскотов).
// Проверяется раз в минуту — фон сменится сам, даже если приложение открыто в 20:00.
import { useEffect, useState } from 'react';

import { getTimeOfDay } from '@/features/mascots';

export function useTimeOfDay() {
  const [timeOfDay, setTimeOfDay] = useState(() => getTimeOfDay());
  useEffect(() => {
    const timer = setInterval(() => setTimeOfDay(getTimeOfDay()), 60 * 1000);
    return () => clearInterval(timer);
  }, []);
  return timeOfDay;
}
