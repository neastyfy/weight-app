// Запись не найдена (например, её уже удалили или ссылка устарела)
import { router } from 'expo-router';

import { AppText, Button, Card, Screen, ScreenHeader } from '@/components';
import { useTranslation } from '@/i18n';

export function EntryNotFound() {
  const { t } = useTranslation();
  return (
    <Screen pushed>
      <ScreenHeader title={t('entries.notFoundTitle')} showBack />
      <Card>
        <AppText color="textSecondary">{t('entries.failure.notFound')}</AppText>
        <Button title={t('common.back')} variant="secondary" onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))} />
      </Card>
    </Screen>
  );
}
