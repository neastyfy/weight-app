// Экран ошибки с кнопкой «Повторить».
// Работает даже без ThemeProvider и LanguageProvider (например, если не открылась база),
// поэтому берёт светлую тему и язык устройства напрямую.
import { getLocales } from 'expo-localization';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { createTranslator } from '@/i18n/translator';
import { fonts } from '@/theme/fonts';
import { themes } from '@/theme/themes';

// reason: 'busy' — база открыта в другой вкладке; 'unsupported' — браузер не может запустить базу;
// без reason — общий текст
export function ErrorScreen({ onRetry, language, reason }) {
  const { colors, radius } = themes.light;
  const t = createTranslator(language ?? getLocales()?.[0]?.languageCode ?? 'en');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>{t(reason ? `errors.${reason}Title` : 'errors.loadTitle')}</Text>
      <Text style={[styles.text, { color: colors.textSecondary }]}>{t(reason ? `errors.${reason}Text` : 'errors.loadText')}</Text>
      {onRetry ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.button,
            { backgroundColor: colors.primary, borderRadius: radius.pill },
            pressed && { opacity: 0.8 },
          ]}
        >
          <Text style={[styles.buttonText, { color: colors.textOnPrimary }]}>{t('common.retry')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  title: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28, textAlign: 'center' },
  text: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 24, textAlign: 'center' },
  button: { marginTop: 12, paddingHorizontal: 32, height: 52, justifyContent: 'center' },
  buttonText: { fontFamily: fonts.semiBold, fontSize: 17 },
});
