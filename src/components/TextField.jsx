// Поле ввода с подписью, подсказкой, ошибкой и единицей измерения справа.
// Пример: <TextField label="Рост" value={…} onChangeText={…} suffix="см" />
import { useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';

export function TextField({ label, hint, error, suffix, disabled = false, style, onFocus, onBlur, ...inputProps }) {
  const { colors, typography, radius, spacing, layout } = useTheme();
  const [focused, setFocused] = useState(false);

  // Цвет рамки показывает состояние поля
  const borderColor = error ? colors.error : focused ? colors.primary : colors.border;

  return (
    <View style={[{ gap: spacing.xs }, style]}>
      {label ? (
        <AppText variant="small" color="textSecondary">
          {label}
        </AppText>
      ) : null}

      <View
        style={[
          styles.box,
          {
            height: layout.inputHeight,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            borderColor,
            backgroundColor: disabled ? colors.surfaceMuted : colors.surface,
          },
          focused && { boxShadow: `0px 0px 0px 4px ${error ? colors.errorSoft : colors.focusRing}` },
        ]}
      >
        <TextInput
          editable={!disabled}
          placeholderTextColor={colors.textTertiary}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            onBlur?.(event);
          }}
          style={[
            styles.input,
            typography.body,
            { color: disabled ? colors.disabledText : colors.text },
            // В браузере убираем стандартную обводку — фокус показывает рамка поля
            Platform.OS === 'web' && { outlineStyle: 'none' },
          ]}
          {...inputProps}
        />
        {suffix ? (
          <AppText variant="caption" color="textSecondary">
            {suffix}
          </AppText>
        ) : null}
      </View>

      {error ? (
        <AppText variant="caption" color="error">
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" color="textTertiary">
          {hint}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    height: '100%',
  },
});
