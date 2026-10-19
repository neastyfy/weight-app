// Нижняя всплывающая панель поверх экрана (выбор даты, подтверждения).
// Пример:
//   <Sheet visible={open} onClose={() => setOpen(false)} title="Дата и время">…</Sheet>
// Панель выезжает снизу на пружине, фон затемняется.
// Закрыть: нажать на фон или смахнуть панель вниз (пальцем или мышью).
import { useEffect } from 'react';
import { Modal, Platform, Pressable, StyleSheet } from 'react-native';
import { GestureDetector, GestureHandlerRootView, usePanGesture } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';

import { useTheme } from '@/theme';
import { springs } from '@/theme/motion';

import { AppText } from './AppText';

const CLOSE_DISTANCE = 120; // px: дальше — панель закрывается
const CLOSE_VELOCITY = 900; // px/с: быстрый смах вниз тоже закрывает

export function Sheet({ visible, onClose, title, children }) {
  const { colors, radius, spacing, layout } = useTheme();
  const insets = useSafeAreaInsets();
  const progress = useSharedValue(0); // 0 — спрятана, 1 — открыта
  const drag = useSharedValue(0); // насколько панель стянута вниз пальцем

  useEffect(() => {
    if (visible) drag.value = 0;
    progress.value = visible ? withSpring(1, springs.move) : withTiming(0, { duration: 150 });
  }, [progress, drag, visible]);

  // Смахивание вниз: активируется только движением вниз, горизонтальные шкалы внутри не мешают
  const swipe = usePanGesture({
    activeOffsetY: 12,
    failOffsetX: [-20, 20],
    onUpdate: (event) => {
      'worklet';
      drag.value = Math.max(0, event.translationY);
    },
    onDeactivate: (event) => {
      'worklet';
      if (event.translationY > CLOSE_DISTANCE || event.velocityY > CLOSE_VELOCITY) {
        drag.value = withTiming(700, { duration: 180 }, () => scheduleOnRN(onClose));
      } else {
        drag.value = withSpring(0, springs.move);
      }
    },
  });

  const backdropStyle = useAnimatedStyle(() => ({ opacity: Math.min(1, progress.value) * Math.max(0, 1 - drag.value / 500) }));
  const panelStyle = useAnimatedStyle(() => ({ transform: [{ translateY: (1 - progress.value) * 400 + drag.value }] }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      {/* Свой корень жестов: внутри модального окна (iOS/Android) иначе не работают шкалы */}
      <GestureHandlerRootView style={styles.root}>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }, backdropStyle]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityRole="button" accessibilityLabel="close" />
        </Animated.View>
        <GestureDetector gesture={swipe}>
          <Animated.View
            testID="sheet-panel"
            style={[
              styles.panel,
              {
                backgroundColor: colors.background,
                borderTopLeftRadius: radius.xl,
                borderTopRightRadius: radius.xl,
                padding: layout.screenPadding,
                paddingBottom: insets.bottom + spacing.lg,
                gap: spacing.md,
                maxWidth: layout.maxContentWidth,
              },
              Platform.OS === 'web' && { userSelect: 'none' },
              panelStyle,
            ]}
          >
            {/* «Ручка» — подсказка, что панель можно смахнуть вниз */}
            <Animated.View style={[styles.handle, { backgroundColor: colors.border }]} />
            {title ? (
              <AppText variant="heading" align="center">
                {title}
              </AppText>
            ) : null}
            {children}
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    // корень на весь экран, панель прижата к низу
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  panel: {
    width: '100%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 5,
    borderRadius: 3,
  },
});
