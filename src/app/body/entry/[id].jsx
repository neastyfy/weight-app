// Редактирование измерения окружности: /body/entry/7
import { useLocalSearchParams } from 'expo-router';

import { BodyMeasurementForm } from '@/features/measurements/BodyMeasurementForm';

export default function EditBodyMeasurementRoute() {
  const { id } = useLocalSearchParams();
  return <BodyMeasurementForm entryId={Number(id)} />;
}
