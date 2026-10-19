// Вкладка «Ещё»: настройки, цель, показатели, история веса и окружности тела.
// Фото и имя меняются в настройках (src/features/settings).
import { router } from 'expo-router';

import { Card, ListRow, Screen, ScreenHeader } from '@/components';
import { useTranslation } from '@/i18n';

export default function MoreScreen() {
  const { t } = useTranslation();

  return (
    <Screen withTabBar>
      <ScreenHeader title={t('screens.more')} />
      <Card style={{ gap: 0, paddingVertical: 4 }}>
        <ListRow icon="settings-outline" iconTone="purple" title={t('settings.title')} onPress={() => router.push('/settings')} />
      </Card>
      <Card style={{ gap: 0, paddingVertical: 4 }}>
        <ListRow icon="flag-outline" iconTone="warning" title={t('goal.editTitle')} onPress={() => router.push('/goal/edit')} />
        <ListRow divider icon="pulse-outline" iconTone="success" title={t('metricsScreen.title')} onPress={() => router.push('/metrics')} />
        <ListRow divider icon="scale-outline" title={t('weight.historyTitle')} onPress={() => router.push('/weight')} />
        <ListRow divider icon="body-outline" iconTone="success" title={t('body.title')} onPress={() => router.push('/body')} />
      </Card>
    </Screen>
  );
}
