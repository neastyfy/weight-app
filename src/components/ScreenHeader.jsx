// Заголовок экрана.
// Без showBack — крупный заголовок слева (главные экраны вкладок).
// С showBack — кнопка «назад» и заголовок по центру (вложенные экраны).
// Пример: <ScreenHeader title="Настройки" showBack />
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme';

import { AnimatedTitle } from './AnimatedTitle';
import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

const BACK_BUTTON_SIZE = 40;

// Назад по истории; если истории нет (экран открыт по ссылке или после обновления страницы) — на главную
function goBack() {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/');
  }
}

// onBack — своё действие кнопки «назад» (например, предыдущий шаг онбординга)
export function ScreenHeader({ title, subtitle, showBack = false, onBack }) {
  const { colors, radius, spacing, shadows } = useTheme();
  const { t } = useTranslation();

  if (!showBack) {
    return (
      <View style={{ gap: spacing.xxs }}>
        <AnimatedTitle variant="largeTitle" key={title}>
          {title}
        </AnimatedTitle>
        {subtitle ? <AppText color="textSecondary">{subtitle}</AppText> : null}
      </View>
    );
  }

  return (
    <View style={styles.row}>
      <PressableScale
        onPress={onBack ?? goBack}
        accessibilityRole="button"
        accessibilityLabel={t('common.back')}
        hitSlop={8}
        scaleTo={0.9}
        style={({ focused }) => [
          styles.backButton,
          { backgroundColor: colors.surface, borderRadius: radius.pill },
          shadows.raised,
          focused && { boxShadow: `0px 0px 0px 3px ${colors.focusRing}` },
        ]}
      >
        <Ionicons name="chevron-back" size={22} color={colors.text} />
      </PressableScale>
      <AppText variant="subheading" align="center" style={styles.title} numberOfLines={1} accessibilityRole="header">
        {title}
      </AppText>
      {/* Пустой блок того же размера, чтобы заголовок был ровно по центру */}
      <View style={styles.backButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: BACK_BUTTON_SIZE,
    height: BACK_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
  },
});
