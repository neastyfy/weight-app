// Нажимаемый элемент с пружинной реакцией: чуть сжимается при нажатии
// и чуть увеличивается при наведении мыши (в браузере). Основа всех кнопок и карточек выбора.
// Пример: <PressableScale onPress={…} style={…}>…</PressableScale>
// style может быть функцией ({ pressed, focused, hovered }) => стиль, как у Pressable.
import { useState } from 'react';
import { Pressable } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { isFocusVisible } from '@/lib/focus';
import { pressScale, springs } from '@/theme/motion';

export function PressableScale({ children, style, disabled, scaleTo = pressScale.pressed, onPressIn, onPressOut, onHoverIn, onHoverOut, ...rest }) {
  const scale = useSharedValue(1);
  const [state, setState] = useState({ pressed: false, hovered: false, focused: false });

  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const animateTo = (value) => {
    scale.value = withSpring(value, springs.press);
  };

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        disabled={disabled}
        onPressIn={(event) => {
          if (!disabled) animateTo(scaleTo);
          setState((s) => ({ ...s, pressed: true }));
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          animateTo(state.hovered && !disabled ? pressScale.hovered : 1);
          setState((s) => ({ ...s, pressed: false }));
          onPressOut?.(event);
        }}
        onHoverIn={(event) => {
          if (!disabled) animateTo(pressScale.hovered);
          setState((s) => ({ ...s, hovered: true }));
          onHoverIn?.(event);
        }}
        onHoverOut={(event) => {
          animateTo(1);
          setState((s) => ({ ...s, hovered: false }));
          onHoverOut?.(event);
        }}
        // focused — только при фокусе с клавиатуры (после щелчка мышью кольцо не показываем)
        onFocus={(event) => setState((s) => ({ ...s, focused: isFocusVisible(event) }))}
        onBlur={() => setState((s) => ({ ...s, focused: false }))}
        style={typeof style === 'function' ? style(state) : style}
        {...rest}
      >
        {children}
      </Pressable>
    </Animated.View>
  );
}
