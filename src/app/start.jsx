// Служебный адрес /start: сразу открывает Главную или онбординг (если профиля ещё нет).
// Нужен для браузера — см. src/lib/crossOriginIsolation.web.js
import { Redirect } from 'expo-router';

import { useProfile } from '@/features/profile';

export default function StartRoute() {
  const { profile } = useProfile();
  return <Redirect href={profile ? '/' : '/onboarding'} />;
}
