// Маскот: показывает персонажа в нужном состоянии.
// Пример: <Mascot mascotId="peach" state="greet" size={200} />
//
// Сейчас это статичная картинка. Когда появятся анимации, достаточно
// поменять только этот компонент (и добавить видео в реестр) —
// экраны, которые используют <Mascot />, переписывать не придётся.
import { Image } from 'react-native';

import { useTranslation } from '@/i18n';

import { DEFAULT_MASCOT_STATE, getMascot, getMascotImage, getMascotOffset } from './mascotRegistry';

export function Mascot({ mascotId, state = DEFAULT_MASCOT_STATE, size = 160, style }) {
  const { t } = useTranslation();
  const mascot = getMascot(mascotId);

  return (
    <Image
      source={getMascotImage(mascot.id, state)}
      // contain — картинка вписывается целиком, без искажения пропорций
      resizeMode="contain"
      // Поправка центровки: некоторые рисунки стоят на холсте не по центру
      style={[{ width: size, height: size, transform: [{ translateX: -getMascotOffset(mascot.id, state) * size }] }, style]}
      accessibilityRole="image"
      accessibilityLabel={t(`mascots.${mascot.id}.name`)}
    />
  );
}
