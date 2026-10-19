// История одной окружности: /body/waist
import { useLocalSearchParams } from 'expo-router';

import { BodyTypeHistoryScreen } from '@/features/measurements/BodyTypeHistoryScreen';

export default function BodyTypeRoute() {
  const { type } = useLocalSearchParams();
  return <BodyTypeHistoryScreen type={type} />;
}
