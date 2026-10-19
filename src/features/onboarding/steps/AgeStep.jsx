// Шаг: возраст. Колесо чисел — центральное крупнее, соседние уменьшаются и тают.
import { useCallback } from 'react';
import { View } from 'react-native';

import { ValuePicker } from '@/components';
import { Mascot } from '@/features/mascots';
import { PICKERS } from '@/features/profile';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme';

export function AgeStep({ draft, update, errors }) {
  const { t, translateError } = useTranslation();
  const { spacing } = useTheme();
  const onChange = useCallback((age) => update({ age }), [update]);

  return (
    <View style={{ gap: spacing.lg }}>
      <View style={{ alignItems: 'center', paddingVertical: spacing.sm }}>
        <Mascot mascotId={draft.mascotId} state="writing" size={160} />
      </View>
      <ValuePicker
        value={draft.age}
        onChange={onChange}
        {...PICKERS.age}
        initialValue={PICKERS.age.initial}
        unit={t('onboarding.age.unit')}
        variant="wheel"
        error={translateError(errors.age)}
      />
    </View>
  );
}
