// Шаг 2: приветствие с маскотом.
import { View } from 'react-native';

import { AppText } from '@/components';
import { Mascot } from '@/features/mascots';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme';

export function WelcomeStep({ draft }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();

  return (
    <View style={{ flex: 1, justifyContent: 'center', gap: spacing.lg }}>
      <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
        <Mascot mascotId={draft.mascotId} state="greet" size={240} />
      </View>
      <View style={{ gap: spacing.sm }}>
        <AppText variant="largeTitle" align="center" accessibilityRole="header">
          {t('onboarding.welcome.title')}
        </AppText>
        <AppText color="textSecondary" align="center">
          {t('onboarding.welcome.text')}
        </AppText>
      </View>
    </View>
  );
}
