// Фото профиля в настройках: текущее фото, выбор нового и возврат стандартного.
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { View } from 'react-native';

import { Appear, AppText, Button, Card, PressableScale } from '@/components';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme';
import { logError } from '@/lib/logError';

import { ProfileAvatar } from './ProfileAvatar';
import { useProfile } from './ProfileProvider';
import { pickProfilePhoto } from './pickProfilePhoto';

const AVATAR_SIZE = 104;

export function ProfileCard() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { profile, setProfilePhoto } = useProfile();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const choosePhoto = async () => {
    setBusy(true);
    setFailed(false);
    try {
      const photo = await pickProfilePhoto();
      if (photo) await setProfilePhoto(photo);
    } catch (error) {
      logError('Не удалось сохранить фото профиля', error);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  };

  const removePhoto = async () => {
    setFailed(false);
    try {
      await setProfilePhoto(null);
    } catch (error) {
      logError('Не удалось убрать фото профиля', error);
      setFailed(true);
    }
  };

  return (
    <Card style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl }}>
      <PressableScale
        onPress={choosePhoto}
        disabled={busy}
        scaleTo={0.94}
        accessibilityRole="button"
        accessibilityLabel={t('profile.choosePhoto')}
      >
        <Appear key={profile.photoUri ?? 'default'} variant="pop">
          <ProfileAvatar size={AVATAR_SIZE} />
        </Appear>
        {/* Значок камеры в углу */}
        <View
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: 34,
            height: 34,
            borderRadius: 17,
            backgroundColor: colors.primary,
            borderWidth: 3,
            borderColor: colors.surface,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="camera" size={16} color={colors.textOnPrimary} />
        </View>
      </PressableScale>

      <View style={{ alignSelf: 'stretch', gap: spacing.xxs, marginTop: spacing.xs }}>
        <Button
          title={busy ? t('profile.photoLoading') : t('profile.choosePhoto')}
          variant="secondary"
          icon="image-outline"
          onPress={choosePhoto}
          disabled={busy}
        />
        {profile.photoUri ? <Button title={t('profile.removePhoto')} variant="text" onPress={removePhoto} /> : null}
      </View>

      {failed ? (
        <AppText variant="caption" color="error" align="center">
          {t('profile.photoError')}
        </AppText>
      ) : null}
    </Card>
  );
}
