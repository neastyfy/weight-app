// Новое измерение окружности: /body/waist/new
import { useLocalSearchParams } from 'expo-router';

import { BodyMeasurementForm } from '@/features/measurements/BodyMeasurementForm';

export default function NewBodyMeasurementRoute() {
  const { type } = useLocalSearchParams();
  return <BodyMeasurementForm type={type} />;
}
