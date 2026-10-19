// Окружности тела: все виды и последние значения.
import { AppText, Screen, ScreenHeader } from '@/components';
import { BodyMeasurementsList } from '@/features/measurements/BodyMeasurementsList';
import { useTranslation } from '@/i18n';

export default function BodyMeasurementsRoute() {
  const { t } = useTranslation();
  return (
    <Screen pushed>
      <ScreenHeader title={t('body.title')} showBack />
      <AppText color="textSecondary">{t('body.subtitle')}</AppText>
      <BodyMeasurementsList />
    </Screen>
  );
}
