// Выбор языка — тот же список с флагами, что и в онбординге. Язык меняется сразу и сохраняется.
import { Screen, ScreenHeader } from '@/components';
import { LanguageStep } from '@/features/onboarding/steps/LanguageStep';
import { useTranslation } from '@/i18n';

export function LanguageScreen() {
  const { t } = useTranslation();
  return (
    <Screen pushed>
      <ScreenHeader title={t('settings.language')} showBack />
      <LanguageStep />
    </Screen>
  );
}
