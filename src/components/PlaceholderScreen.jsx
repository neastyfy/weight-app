// Временный экран-заглушка для разделов, которые ещё не реализованы.
// Удалить, когда у всех вкладок появятся настоящие экраны.
import { View } from 'react-native';

import { Mascot } from '@/features/mascots';
import { useProfile } from '@/features/profile';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { Card } from './Card';
import { Screen } from './Screen';
import { ScreenHeader } from './ScreenHeader';

export function PlaceholderScreen({ title, mascotState = 'idle', children }) {
  const { spacing } = useTheme();
  const { t } = useTranslation();
  const { profile } = useProfile();

  return (
    <Screen withTabBar>
      <ScreenHeader title={title} />

      <Card style={{ alignItems: 'center', paddingVertical: spacing.xl }}>
        <View
          style={{
            alignSelf: 'stretch',
            alignItems: 'center',
            paddingVertical: spacing.md,
          }}
        >
          <Mascot mascotId={profile?.mascotId} state={mascotState} size={180} />
        </View>
        <AppText variant="heading" align="center" style={{ marginTop: spacing.xs }}>
          {t('placeholder.title')}
        </AppText>
        <AppText color="textSecondary" align="center">
          {t('placeholder.text')}
        </AppText>
      </Card>

      {children}
    </Screen>
  );
}
