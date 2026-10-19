// Шаг: имя или никнейм.
import { View } from 'react-native';

import { TextField } from '@/components';
import { Mascot } from '@/features/mascots';
import { LIMITS } from '@/features/profile';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme';

export function NameStep({ draft, update, errors, onSubmit }) {
  const { t, translateError } = useTranslation();
  const { spacing } = useTheme();

  return (
    <View style={{ gap: spacing.xxxl }}>
      <TextField
        label={t('onboarding.name.label')}
        placeholder={t('onboarding.name.placeholder')}
        value={draft.nickname}
        onChangeText={(nickname) => update({ nickname })}
        error={translateError(errors.nickname)}
        maxLength={LIMITS.nicknameMaxLength}
        autoCapitalize="words"
        autoCorrect={false}
        autoComplete="nickname"
        returnKeyType="next"
        onSubmitEditing={onSubmit}
        autoFocus
      />
      <View style={{ alignItems: 'center' }}>
        <Mascot mascotId={draft.mascotId} state="question" size={200} />
      </View>
    </View>
  );
}
