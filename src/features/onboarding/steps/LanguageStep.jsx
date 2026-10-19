// Шаг 1: выбор языка (с флагами). Язык меняется сразу и сохраняется.
import { View } from 'react-native';

import { Flag, SelectableRow } from '@/components';
import { LANGUAGES, useTranslation } from '@/i18n';
import { useTheme } from '@/theme';

export function LanguageStep() {
  const { language, setLanguage } = useTranslation();
  const { spacing } = useTheme();

  return (
    <View style={{ gap: spacing.xs }} accessibilityRole="radiogroup">
      {LANGUAGES.map((item) => (
        <SelectableRow
          key={item.code}
          label={item.nativeName}
          leading={<Flag code={item.code} size={33} />}
          selected={item.code === language}
          onPress={() => setLanguage(item.code)}
        />
      ))}
    </View>
  );
}
