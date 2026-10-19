// Настройки анимаций — одно место для «характера» движения во всём приложении.
// Пружины короткие и мягкие: живо, но без лишних колебаний.
// Системная настройка «Уменьшение движения» учитывается автоматически (ReduceMotion.System).
import { ReduceMotion } from 'react-native-reanimated';

export const springs = {
  // Нажатие на кнопки и карточки — быстро и упруго
  press: { damping: 15, stiffness: 320, mass: 0.6, reduceMotion: ReduceMotion.System },
  // Перемещение элементов (переключатели, индикаторы, прогресс)
  move: { damping: 20, stiffness: 220, mass: 0.8, reduceMotion: ReduceMotion.System },
  // Докатывание шкалы до ближайшего деления — мягко, без рывка
  settle: { damping: 26, stiffness: 120, mass: 1, reduceMotion: ReduceMotion.System },
  // Плавное перемещение без перелёта (ползунок переключателя)
  glide: { damping: 24, stiffness: 260, mass: 0.6, overshootClamping: true, reduceMotion: ReduceMotion.System },
  // Небольшой «подскок» (иконка вкладки, галочка)
  pop: { damping: 9, stiffness: 260, mass: 0.6, reduceMotion: ReduceMotion.System },
};

// Масштаб при нажатии и наведении
export const pressScale = {
  pressed: 0.96,
  hovered: 1.015,
};

