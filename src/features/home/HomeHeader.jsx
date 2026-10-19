// Верх Главной — как в референсе:
//   • картинка с маскотом на всю ширину экрана, от самого верха (обрезана снизу, низ растворяется в фоне);
//   • поверх неё — строка приветствия на полупрозрачной «стеклянной» плашке (картинка под ней
//     размыта): фото, «Привет, имя!», под ним короткий статус («Отличный прогресс! 💪»,
//     см. getGreetingStatus) и шестерёнка — текст хорошо читается на любой картинке;
//   • «облачко» с мотивирующей фразой справа, рядом с маскотом.
// Картинка зависит от времени суток (днём — пикник, вечером и ночью — маскот спит)
// и от темы (светлый или тёмный вариант), см. getMascotBackground.
// Карточка «Текущий вес» немного наезжает на картинку снизу.
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, StyleSheet, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AnimatedTitle, AppText, PressableScale } from '@/components';
import { getMascotBackground } from '@/features/mascots';
import { ProfileAvatar, useProfile } from '@/features/profile';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme';

import { getGreetingStatus } from './homeModel';
import { useMotivationPhrase } from './useMotivationPhrase';
import { useTimeOfDay } from './useTimeOfDay';

// Картинка квадратная. Под приветствием видна полоса высотой PICTURE_RATIO от ширины экрана;
// картинка начинается чуть выше приветствия (на IMAGE_SHIFT от ширины), низ обрезается.
const PICTURE_RATIO = 0.64;
const IMAGE_SHIFT = 0.06;
const GREETING_PADDING = 8; // внутренний отступ плашки приветствия
const GREETING_HEIGHT = 52 + GREETING_PADDING * 2; // высота плашки: аватарка 52 + отступы
// На сколько карточка под шапкой наезжает на картинку
const HERO_OVERLAP = 36;

// summary — из getWeightSummary, goal — текущая цель, now — текущее время
export function HomeHeader({ summary, goal, now }) {
  const { t } = useTranslation();
  const { colors, spacing, radius, layout, scheme, shadows } = useTheme();
  const { profile, goalProgress } = useProfile();
  const { width: windowWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const phrase = useMotivationPhrase();
  const timeOfDay = useTimeOfDay();
  const status = getGreetingStatus({ summary, goal, goalProgress, timeOfDay, now });

  // В браузере приложение не шире «телефона»
  const width = Math.min(windowWidth, layout.maxContentWidth);
  const topOffset = insets.top + spacing.md; // отступ, который даёт экран сверху
  const pictureHeight = width * PICTURE_RATIO;
  const heroHeight = topOffset + GREETING_HEIGHT + spacing.xs + pictureHeight;
  // Картинка всегда начинается от самого верха экрана (под «чёлкой» тоже): если по расчёту она
  // начинается ниже, растягиваем её вверх, а низ оставляем на месте
  const imageGap = Math.max(0, topOffset - width * IMAGE_SHIFT);
  const imageSize = width + imageGap;

  return (
    <View
      style={{
        height: heroHeight,
        overflow: 'hidden', // картинка не должна выходить за шапку
        // на всю ширину и под строку состояния: выходим за отступы экрана
        marginHorizontal: -layout.screenPadding,
        marginTop: -topOffset,
        // карточка «Текущий вес» наезжает на картинку (отступ между блоками экрана тоже «съедаем»)
        marginBottom: -(HERO_OVERLAP + spacing.lg),
      }}
    >
      <Image
        source={getMascotBackground(profile.mascotId, timeOfDay, scheme)}
        // явные размеры: в браузере картинка без них берёт свой исходный размер
        style={{
          position: 'absolute',
          top: topOffset - width * IMAGE_SHIFT - imageGap,
          left: (width - imageSize) / 2,
          width: imageSize,
          height: imageSize,
        }}
        resizeMode="cover"
        accessibilityIgnoresInvertColors
      />
      {/* Снизу картинка растворяется в фоне экрана */}
      <LinearGradient
        colors={[`${colors.background}00`, colors.background]}
        style={[styles.fade, { bottom: 0, height: pictureHeight * 0.34 }]}
      />

      {/* Приветствие — на полупрозрачной «стеклянной» плашке */}
      <View
        style={{
          height: GREETING_HEIGHT,
          marginTop: topOffset,
          marginHorizontal: layout.screenPadding - GREETING_PADDING,
          padding: GREETING_PADDING,
          paddingRight: GREETING_PADDING + 2,
          borderRadius: radius.lg,
          overflow: 'hidden',
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.sm,
        }}
      >
        {/* размытие картинки под плашкой + лёгкая заливка цветом карточек */}
        <BlurView intensity={30} tint={scheme} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: `${colors.surface}9E` }]} />
        <ProfileAvatar size={52} style={shadows.raised} />
        <View style={{ flex: 1, gap: 2 }}>
          <AnimatedTitle variant="heading">{t('home.greeting', { name: profile.nickname })}</AnimatedTitle>
          <AppText variant="small" color="textSecondary">
            {t(`home.status.${status}`)}
          </AppText>
        </View>
        {/* Настройки — как шестерёнка в референсе */}
        <PressableScale
          onPress={() => router.push('/settings')}
          accessibilityRole="button"
          accessibilityLabel={t('settings.title')}
          hitSlop={6}
          style={[
            {
              width: 44,
              height: 44,
              borderRadius: radius.pill,
              backgroundColor: colors.surface,
              alignItems: 'center',
              justifyContent: 'center',
            },
            shadows.raised,
          ]}
        >
          <Ionicons name="settings-outline" size={22} color={colors.textSecondary} />
        </PressableScale>
      </View>

      {/* «Облачко» с фразой справа, с хвостиком в сторону маскота */}
      {phrase ? (
        <View
          style={[
            {
              position: 'absolute',
              right: layout.screenPadding,
              top: topOffset + GREETING_HEIGHT + pictureHeight * 0.12,
              // почти квадратное: узкое, текст переносится на 3–4 строки
              width: Math.min(176, width * 0.46),
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.md,
              borderRadius: radius.lg,
              backgroundColor: colors.surface,
            },
            shadows.raised,
          ]}
        >
          <View style={[styles.tail, { backgroundColor: colors.surface }]} />
          <AppText variant="body">{phrase}</AppText>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fade: { position: 'absolute', left: 0, right: 0 },
  // хвостик облачка — повёрнутый квадрат у левого края, смотрит на маскота
  tail: { position: 'absolute', left: -6, top: 22, width: 18, height: 18, borderRadius: 3, transform: [{ rotate: '45deg' }] },
});
