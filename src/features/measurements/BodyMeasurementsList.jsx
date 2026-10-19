// Список видов окружностей с последним значением. Нажатие — история этого вида.
// Используется на вкладке «Показатели» и на экране «Окружности тела».
import { router } from 'expo-router';

import { AppText, Card, ListRow } from '@/components';
import { useProfile } from '@/features/profile';
import { useTranslation } from '@/i18n';
import { formatCircumference, formatDate } from '@/lib/format';

import { useMeasurements } from './MeasurementsProvider';
import { BODY_MEASUREMENT_TYPES } from './measurementModel';

export function BodyMeasurementsList() {
  const { t, language } = useTranslation();
  const { profile } = useProfile();
  const { bodyMeasurements } = useMeasurements();
  const unit = profile.heightUnit;

  return (
    <Card style={{ gap: 0, paddingVertical: 4 }}>
      {BODY_MEASUREMENT_TYPES.map((type, index) => {
        // список отсортирован: первая запись вида — последняя по дате
        const latest = bodyMeasurements.find((m) => m.type === type.id);
        return (
          <ListRow
            key={type.id}
            divider={index > 0}
            icon={type.icon}
            iconTone={latest ? 'success' : 'primary'}
            title={t(`body.types.${type.id}`)}
            subtitle={latest ? formatDate(latest.measuredAt, language) : t('body.noData')}
            value={latest ? `${formatCircumference(latest.valueCm, unit, language)} ${t(`units.${unit}`)}` : null}
            onPress={() => router.push(`/body/${type.id}`)}
          />
        );
      })}
      <AppText variant="small" color="textTertiary" style={{ paddingVertical: 8 }}>
        {t('body.optionalNote')}
      </AppText>
    </Card>
  );
}
