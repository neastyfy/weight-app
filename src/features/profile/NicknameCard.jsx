// Изменение имени в настройках. Проверка — та же, что в онбординге (validateNickname).
import { useState } from 'react';

import { AppText, Button, Card, TextField } from '@/components';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme';
import { logError } from '@/lib/logError';

import { LIMITS, validateNickname } from './profileModel';
import { useProfile } from './ProfileProvider';

export function NicknameCard() {
  const { t, translateError } = useTranslation();
  const { spacing } = useTheme();
  const { profile, setNickname } = useProfile();
  const [value, setValue] = useState(profile.nickname);
  const [error, setError] = useState(null);
  // status: 'idle' | 'saving' | 'saved' | 'failed'
  const [status, setStatus] = useState('idle');

  const changed = value.trim() !== profile.nickname;

  const save = async () => {
    const validation = validateNickname(value);
    setError(validation);
    if (validation || !changed) return;
    setStatus('saving');
    try {
      await setNickname(value);
      setValue(value.trim());
      setStatus('saved');
    } catch (saveError) {
      logError('Не удалось сохранить имя', saveError);
      setStatus('failed');
    }
  };

  return (
    <Card style={{ gap: spacing.sm }}>
      <TextField
        label={t('onboarding.name.label')}
        placeholder={t('onboarding.name.placeholder')}
        value={value}
        onChangeText={(text) => {
          setValue(text);
          setError(null);
          setStatus('idle');
        }}
        error={translateError(error)}
        maxLength={LIMITS.nicknameMaxLength}
        autoCapitalize="words"
        autoCorrect={false}
        autoComplete="nickname"
        returnKeyType="done"
        onSubmitEditing={save}
      />
      <Button
        title={status === 'saving' ? t('common.saving') : t('common.save')}
        icon="checkmark"
        onPress={save}
        disabled={!changed || status === 'saving'}
      />
      {status === 'saved' ? (
        <AppText variant="caption" color="successText" align="center">
          {t('settings.nameSaved')}
        </AppText>
      ) : null}
      {status === 'failed' ? (
        <AppText variant="caption" color="error" align="center">
          {t('errors.saveFailed')}
        </AppText>
      ) : null}
    </Card>
  );
}
