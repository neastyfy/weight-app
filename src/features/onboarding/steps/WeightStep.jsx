// Шаг: текущий вес. Горизонтальная линейка, как на референсе.
import { useCallback } from 'react';
import { View } from 'react-native';

import { ValuePicker } from '@/components';
import { Mascot } from '@/features/mascots';
import { PICKERS } from '@/features/profile';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme';

export function WeightStep({ draft, update, errors }) {
  const { t, translateError } = useTranslation();
  const { spacing } = useTheme();
  const picker = PICKERS.weight[draft.weightUnit];
  const onChange = useCallback((weight) => update({ weight }), [update]);

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ alignItems: 'center', paddingVertical: spacing.sm }}>
        <Mascot mascotId={draft.mascotId} state="weight" size={160} />
      </View>
      <ValuePicker
        value={draft.weight}
        onChange={onChange}
        {...picker}
        initialValue={picker.initial}
        unit={t(`units.${draft.weightUnit}`)}
        error={translateError(errors.weight)}
      />
    </View>
  );
}
