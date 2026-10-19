// Изменение одного параметра профиля: /settings/profile/height, …/age, …/sex, …/activity, …/mascot
import { useLocalSearchParams } from 'expo-router';

import { ProfileFieldScreen } from '@/features/settings/ProfileFieldScreen';

export default function ProfileFieldRoute() {
  const { field } = useLocalSearchParams();
  return <ProfileFieldScreen key={field} field={field} />;
}
