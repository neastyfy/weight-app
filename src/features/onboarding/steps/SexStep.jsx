// Шаг: пол — необязательно, только для оценки BMR. По умолчанию «Не указывать».
import { View } from 'react-native';

import { SelectableRow } from '@/components';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme';

const OPTIONS = [
  { value: 'female', icon: 'female', tone: 'pink' },
  { value: 'male', icon: 'male', tone: 'primary' },
  { value: null, icon: 'remove-circle-outline', tone: 'purple' },
];

export function SexStep({ draft, update }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();

  return (
    <View style={{ gap: spacing.xs }} accessibilityRole="radiogroup">
      {OPTIONS.map((option) => (
        <SelectableRow
          key={String(option.value)}
          label={t(`onboarding.sex.${option.value ?? 'none'}`)}
          icon={option.icon}
          iconTone={option.tone}
          selected={draft.sex === option.value}
          onPress={() => update({ sex: option.value })}
        />
      ))}
    </View>
  );
}
