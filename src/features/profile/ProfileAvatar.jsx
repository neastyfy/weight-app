// Круглое фото профиля. Если фото не выбрано — стандартная картинка (assets/profile.png).
// Пример: <ProfileAvatar size={64} />
import { Image, View } from 'react-native';

import { useTheme } from '@/theme';

import { useProfile } from './ProfileProvider';

const DEFAULT_PHOTO = require('@assets/profile.png');

export function ProfileAvatar({ size = 56, photoUri, style }) {
  const { colors } = useTheme();
  const { profile } = useProfile();
  const uri = photoUri !== undefined ? photoUri : profile?.photoUri;

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.sky,
          borderWidth: 2,
          borderColor: colors.surface,
          overflow: 'hidden',
        },
        style,
      ]}
    >
      <Image
        source={uri ? { uri } : DEFAULT_PHOTO}
        // своё фото заполняет круг целиком, стандартная картинка — с небольшими полями
        resizeMode={uri ? 'cover' : 'contain'}
        style={{ width: '100%', height: '100%' }}
        accessibilityIgnoresInvertColors
      />
    </View>
  );
}
