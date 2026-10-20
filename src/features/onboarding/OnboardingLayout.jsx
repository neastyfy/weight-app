// Общий макет шага онбординга:
//   сверху — «назад» и индикатор прогресса (не двигаются),
//   в середине — заголовок и содержимое шага; при смене шага они уезжают
//   и приезжают на пружине (вперёд — справа налево, назад — наоборот),
//   снизу — кнопки «Далее» и «Пропустить» (всегда видны).
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import Animated, { FadeInLeft, FadeInRight, FadeOutLeft, FadeOutRight } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedTitle, AppText, Button, PressableScale, ProgressBar } from '@/components';
import { LANGUAGES, createTranslator, useTranslation } from '@/i18n';
import { useTheme } from '@/theme';

const HEADER_BUTTON_SIZE = 40;

// Анимации смены шага
const springIn = (animation) => animation.springify().damping(19).stiffness(170).mass(0.9);
const TRANSITIONS = {
  forward: { entering: springIn(FadeInRight), exiting: FadeOutLeft.duration(160) },
  back: { entering: springIn(FadeInLeft), exiting: FadeOutRight.duration(160) },
};

export function OnboardingLayout({
  stepId,
  direction = 'forward',
  scroll = true,
  children,
  onBack,
  progress,
  progressLabel,
  primaryLabel,
  primaryIcon,
  onPrimary,
  primaryDisabled,
  skipLabel,
  onSkip,
  footer,
}) {
  const { colors, spacing, radius, layout, shadows } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // У приветствия свой крупный заголовок внутри шага
  const showTitle = stepId !== 'welcome';
  const transition = TRANSITIONS[direction];

  const body = (
    <>
      {showTitle ? (
        <StepHeading stepId={stepId} t={t} gap={spacing.xs} reserveForAllLanguages={stepId === 'language'} />
      ) : null}
      {children}
    </>
  );
  const contentStyle = { padding: layout.screenPadding, gap: spacing.lg, flexGrow: 1 };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Верхняя строка: назад + прогресс */}
      <View
        style={[
          styles.header,
          { paddingTop: insets.top + spacing.sm, paddingHorizontal: layout.screenPadding, gap: spacing.md },
        ]}
      >
        {onBack ? (
          <PressableScale
            onPress={onBack}
            scaleTo={0.9}
            accessibilityRole="button"
            accessibilityLabel={t('common.back')}
            hitSlop={8}
            style={({ focused }) => [
              styles.backButton,
              { backgroundColor: colors.surface, borderRadius: radius.pill },
              shadows.raised,
              focused && { boxShadow: `0px 0px 0px 3px ${colors.focusRing}` },
            ]}
          >
            <Ionicons name="chevron-back" size={22} color={colors.text} />
          </PressableScale>
        ) : (
          <View style={styles.backButton} />
        )}
        {progress != null ? (
          <View style={{ flex: 1, gap: spacing.xxs }}>
            <ProgressBar progress={progress} />
            <AppText variant="small" color="textTertiary">
              {progressLabel}
            </AppText>
          </View>
        ) : null}
      </View>

      {/* Содержимое шага — со сменой на пружине */}
      <View style={styles.stage}>
        <Animated.View key={stepId} entering={transition.entering} exiting={transition.exiting} style={StyleSheet.absoluteFill}>
          {scroll ? (
            <ScrollView style={{ flex: 1 }} contentContainerStyle={contentStyle} keyboardShouldPersistTaps="handled">
              {body}
            </ScrollView>
          ) : (
            <View style={[{ flex: 1 }, contentStyle]}>{body}</View>
          )}
        </Animated.View>
      </View>

      {/* Кнопки внизу */}
      <View
        style={{
          paddingHorizontal: layout.screenPadding,
          paddingTop: spacing.sm,
          paddingBottom: insets.bottom + spacing.md,
          gap: spacing.xxs,
        }}
      >
        {footer ? <View style={{ paddingBottom: spacing.sm }}>{footer}</View> : null}
        <Button title={primaryLabel} icon={primaryIcon} onPress={onPrimary} disabled={primaryDisabled} />
        {skipLabel ? <Button title={skipLabel} variant="text" onPress={onSkip} /> : null}
      </View>
    </KeyboardAvoidingView>
  );
}

// Заголовок и описание шага.
// reserveForAllLanguages — на шаге выбора языка текст меняется сразу при выборе, и описание
// на разных языках занимает разное число строк: тогда список под ним прыгал бы. Поэтому
// невидимо меряем заголовок на всех языках и держим высоту самого длинного.
function StepHeading({ stepId, t, gap, reserveForAllLanguages }) {
  const [minHeight, setMinHeight] = useState(0);
  const heading = (translate) => (
    <>
      <AnimatedTitle variant="title">{translate(`onboarding.${stepId}.title`)}</AnimatedTitle>
      <AppText color="textSecondary">{translate(`onboarding.${stepId}.subtitle`)}</AppText>
    </>
  );

  return (
    <View style={{ gap, minHeight }}>
      {heading(t)}
      {reserveForAllLanguages
        ? LANGUAGES.map(({ code }) => (
            <View
              key={code}
              style={[styles.measure, { gap }]}
              pointerEvents="none"
              aria-hidden
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              onLayout={(event) => {
                const { height } = event.nativeEvent.layout;
                setMinHeight((current) => Math.max(current, height));
              }}
            >
              {heading(createTranslator(code))}
            </View>
          ))
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // невидимая копия для замера высоты (та же ширина, что у настоящего текста)
  measure: { position: 'absolute', top: 0, left: 0, right: 0, opacity: 0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: HEADER_BUTTON_SIZE,
  },
  backButton: {
    width: HEADER_BUTTON_SIZE,
    height: HEADER_BUTTON_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stage: {
    flex: 1,
    overflow: 'hidden',
  },
});
