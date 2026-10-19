// Шаг: рост. Вертикальная линейка, слева от неё — маскот с линейкой роста
// (по центру высоты шкалы).
import { useCallback } from 'react';
import { useWindowDimensions } from 'react-native';

import { ValuePicker } from '@/components';
import { Mascot } from '@/features/mascots';
import { PICKERS } from '@/features/profile';
import { useTranslation } from '@/i18n';

export function HeightStep({ draft, update, errors }) {
  const { t, translateError } = useTranslation();
  const { height: windowHeight } = useWindowDimensions();
  const picker = PICKERS.height[draft.heightUnit];
  const onChange = useCallback((height) => update({ height }), [update]);

  return (
    <ValuePicker
      value={draft.height}
      onChange={onChange}
      {...picker}
      initialValue={picker.initial}
      unit={t(`units.${draft.heightUnit}`)}
      orientation="vertical"
      length={Math.min(320, Math.max(200, windowHeight * 0.34))}
      error={translateError(errors.height)}
      aside={<Mascot mascotId={draft.mascotId} state="height" size={170} />}
    />
  );
}
