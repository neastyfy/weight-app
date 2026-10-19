// Редактирование записи веса: /weight/12
import { useLocalSearchParams } from 'expo-router';

import { WeightEntryForm } from '@/features/measurements/WeightEntryForm';

export default function EditWeightRoute() {
  const { id } = useLocalSearchParams();
  return <WeightEntryForm entryId={Number(id)} />;
}
