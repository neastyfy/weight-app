// Выбор числа перетаскиванием шкалы (рост, вес, возраст).
//
//   <ValuePicker
//     value={72.4}            // число или null (ещё не выбрано)
//     onChange={setWeight}    // вызывается, когда шкала остановилась
//     min={30} max={300} step={0.1}
//     unit="кг"
//     variant="ruler"         // 'ruler' — линейка с делениями, 'wheel' — колесо чисел
//     orientation="horizontal"// или 'vertical' (значения растут вверх)
//     fadeColor="surface"     // если шкала стоит не на фоне экрана, а, например, в карточке
//     autoSelect={false}      // для необязательных полей: без касания значение не выбрано
//     compact                 // только шкала, без крупного числа и кнопок (например, часы и минуты)
//     formatLabel={(v) => …}  // свой формат подписей (например, «07» для минут)
//     aside={<Mascot />}      // элемент слева от вертикальной линейки, по центру её высоты
//   />
//
// Как работает: шкала — длинная лента, которую тянут пальцем (или мышью).
// После броска она катится по инерции (дальше — если бросить резче), плавно замедляется
// и мягко встаёт на ближайшее деление.
// Отрисовываются только деления рядом с центром — даже у шкалы на тысячи делений.
// Есть кнопки −/+ и ручной ввод (нажать на число), а также поддержка VoiceOver.
import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import { GestureDetector, usePanGesture } from 'react-native-gesture-handler';
import Animated, {
  cancelAnimation,
  withDecay,
  Extrapolation,
  interpolate,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useTranslation } from '@/i18n';
import { formatNumber } from '@/lib/format';
import { parseDecimal } from '@/lib/units';
import { useTheme } from '@/theme';
import { springs } from '@/theme/motion';

import { AppText } from './AppText';
import { PressableScale } from './PressableScale';

const RULER_SPACING = 12; // расстояние между делениями линейки, px
const WHEEL_SPACING = 64; // расстояние между числами колеса, px
// Инерция: после броска шкала катится и плавно замедляется, как прокрутка в iOS.
// Чем резче бросок, тем дальше она уедет. Ближе к 1 — дольше катится.
const DECELERATION = 0.996;
const FLING_STRENGTH = 0.65; // доля скорости броска, которая уходит в инерцию: меньше — спокойнее
const MIN_FLING_VELOCITY = 80; // px/с: медленнее — просто встаём на ближайшее деление
const HAPTIC_INTERVAL = 35; // мс: не чаще, чтобы при быстром броске вибрация не «гудела»
const EDGE_RESISTANCE = 0.35; // сопротивление при вытягивании за край

function ValuePickerComponent({
  value,
  onChange,
  onPreview,
  min,
  max,
  step,
  initialValue,
  unit,
  hint,
  variant = 'ruler',
  orientation = 'horizontal',
  length,
  majorEvery = 10,
  labelEvery = 10,
  error,
  fadeColor,
  autoSelect = true,
  compact = false,
  formatLabel,
  aside,
}) {
  const { colors, radius, spacing } = useTheme();
  const { t, language } = useTranslation();

  const vertical = orientation === 'vertical';
  const itemSpacing = variant === 'wheel' ? WHEEL_SPACING : RULER_SPACING;
  const count = Math.round((max - min) / step);
  const decimals = step < 1 ? 1 : 0;

  const toIndex = useCallback((v) => Math.min(count, Math.max(0, Math.round((v - min) / step))), [count, min, step]);
  const toValue = useCallback((index) => Number((min + index * step).toFixed(decimals)), [min, step, decimals]);

  const startIndex = toIndex(value ?? initialValue ?? min);
  const [displayIndex, setDisplayIndex] = useState(startIndex);
  const [windowCenter, setWindowCenter] = useState(startIndex);
  const [size, setSize] = useState(0); // длина видимой области шкалы
  const [editing, setEditing] = useState(false);

  // Положение шкалы в пикселях (индекс × расстояние между делениями)
  const position = useSharedValue(startIndex * itemSpacing);
  const dragStart = useSharedValue(0);
  const maxPosition = count * itemSpacing;
  const committedIndex = useRef(value == null ? null : startIndex);
  const lastHaptic = useRef(0);

  // Сохраняем выбранное значение (после остановки шкалы, кнопок или ручного ввода)
  const commit = useCallback(
    (index) => {
      committedIndex.current = index;
      onChange(toValue(index));
    },
    [onChange, toValue],
  );

  // Каждое новое деление под указателем: обновить число, сдвинуть «окно» делений, лёгкая вибрация
  const handleIndex = useCallback(
    (index) => {
      setDisplayIndex(index);
      setWindowCenter((center) => (Math.abs(index - center) > 25 ? index : center));
      onPreview?.(toValue(index));
      const now = Date.now();
      if (Platform.OS !== 'web' && now - lastHaptic.current > HAPTIC_INTERVAL) {
        lastHaptic.current = now;
        Haptics.selectionAsync();
      }
    },
    [onPreview, toValue],
  );

  useAnimatedReaction(
    () => Math.min(count, Math.max(0, Math.round(position.value / itemSpacing))),
    (index, previous) => {
      if (previous !== null && index !== previous) scheduleOnRN(handleIndex, index);
    },
  );

  // Плавно перевести шкалу к индексу
  const animateTo = useCallback(
    (index) => {
      position.value = withSpring(index * itemSpacing, springs.settle);
    },
    [position, itemSpacing],
  );

  // Начальное положение шкалы сразу считается выбранным значением
  // (кроме необязательных полей: там autoSelect={false} — без касания значения нет)
  useEffect(() => {
    if (autoSelect && value == null) commit(startIndex);
    // только при первом показе
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Значение поменялось снаружи (например, сменили единицы) — шкала переезжает
  useEffect(() => {
    if (value == null) return;
    const index = toIndex(value);
    if (index !== committedIndex.current) {
      committedIndex.current = index;
      animateTo(index);
    }
  }, [value, toIndex, animateTo]);

  const pan = usePanGesture({
    activeOffsetX: vertical ? undefined : [-6, 6],
    activeOffsetY: vertical ? [-6, 6] : undefined,
    failOffsetY: vertical ? undefined : [-20, 20],
    failOffsetX: vertical ? [-20, 20] : undefined,
    onBegin: () => {
      'worklet';
      cancelAnimation(position);
      dragStart.value = position.value;
    },
    onUpdate: (event) => {
      'worklet';
      const translation = vertical ? event.translationY : -event.translationX;
      let next = dragStart.value + translation;
      if (next < 0) next *= EDGE_RESISTANCE;
      if (next > maxPosition) next = maxPosition + (next - maxPosition) * EDGE_RESISTANCE;
      position.value = next;
    },
    onDeactivate: (event) => {
      'worklet';
      const velocity = vertical ? event.velocityY : -event.velocityX;

      // Мягко встать на ближайшее деление и сохранить значение
      const settle = () => {
        'worklet';
        const index = Math.min(count, Math.max(0, Math.round(position.value / itemSpacing)));
        position.value = withSpring(index * itemSpacing, springs.settle, (finished) => {
          if (finished) scheduleOnRN(commit, index);
        });
      };

      // Значение считается выбранным сразу при отпускании (можно сразу нажать «Далее»),
      // а когда шкала остановится — уточняется
      scheduleOnRN(commit, Math.min(count, Math.max(0, Math.round(position.value / itemSpacing))));

      const outOfBounds = position.value < 0 || position.value > maxPosition;
      if (Math.abs(velocity) < MIN_FLING_VELOCITY || outOfBounds) {
        settle();
        return;
      }
      // Катимся по инерции с силой броска; у краёв — упругий отскок, затем встаём на деление
      position.value = withDecay(
        {
          velocity: velocity * FLING_STRENGTH,
          deceleration: DECELERATION,
          clamp: [0, maxPosition],
          rubberBandEffect: true,
          rubberBandFactor: 0.7,
        },
        (finished) => {
          if (finished) settle();
        },
      );
    },
  });

  const nudge = (direction) => {
    const index = Math.min(count, Math.max(0, displayIndex + direction));
    animateTo(index);
    commit(index);
  };

  const stripStyle = useAnimatedStyle(() =>
    vertical
      ? { transform: [{ translateY: size / 2 + position.value }] }
      : { transform: [{ translateX: size / 2 - position.value }] },
  );

  // Индексы делений, которые нужно отрисовать сейчас
  const visibleCount = Math.ceil(size / itemSpacing / 2) + 30;
  const indices = [];
  for (let i = Math.max(0, windowCenter - visibleCount); i <= Math.min(count, windowCenter + visibleCount); i += 1) {
    indices.push(i);
  }

  const isSet = value != null;
  const labelFor = (index) =>
    formatLabel ? formatLabel(toValue(index)) : formatNumber(toValue(index), language, decimals);
  const crossSize = variant === 'wheel' ? (compact ? 60 : 76) : 88;
  // Края шкалы растворяются в фоне экрана (fadeColor — цвет фона под шкалой)
  // fadeColor — цвет или ключ цвета темы ('surface'); по умолчанию фон экрана
  const fadeBase = colors[fadeColor] ?? fadeColor ?? colors.background;
  const fade = [fadeBase, `${fadeBase}00`];

  return (
    <View style={{ gap: compact ? spacing.xs : spacing.md, alignItems: 'center', flex: vertical ? 1 : undefined }}>
      {/* Крупное значение. Нажатие — ручной ввод с клавиатуры */}
      {compact ? null : editing ? (
        <ManualInput
          initial={isSet ? String(value) : ''}
          unit={unit}
          min={min}
          max={max}
          decimals={decimals}
          onDone={(next) => {
            setEditing(false);
            if (next != null) {
              const index = toIndex(next);
              animateTo(index);
              commit(index);
            }
          }}
        />
      ) : (
        <PressableScale
          onPress={() => setEditing(true)}
          accessibilityRole="adjustable"
          accessibilityLabel={`${formatNumber(toValue(displayIndex), language, decimals)} ${unit}`}
          accessibilityHint={t('picker.typeHint')}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={(event) => nudge(event.nativeEvent.actionName === 'increment' ? 1 : -1)}
          style={styles.readout}
        >
          <AppText variant="number" color={isSet ? 'text' : 'textTertiary'} style={styles.readoutNumber}>
            {formatNumber(toValue(displayIndex), language, decimals)}
          </AppText>
          {/* Единица и карандаш — справа от числа, не сдвигая само число с центра */}
          <View style={styles.readoutSuffix} pointerEvents="none">
            <AppText variant="subheading" color="textSecondary">
              {unit}
            </AppText>
            <Ionicons name="create-outline" size={16} color={colors.textTertiary} />
          </View>
        </PressableScale>
      )}

      {compact && !error ? null : (
        <AppText variant="caption" color={error ? 'error' : 'textTertiary'} align="center">
          {error ?? (isSet ? t('picker.dragHint') : (hint ?? t('picker.dragHint')))}
        </AppText>
      )}

      {aside ? (
        // Рядом с вертикальной линейкой — свой элемент, по центру её высоты
        <View style={[styles.asideRow, { gap: spacing.md }]}>
          <View style={styles.aside}>{aside}</View>
          <View style={[styles.controls, vertical && styles.controlsVertical, { gap: spacing.sm }]}>
            {compact ? null : (
              <StepButton
                icon={vertical ? 'chevron-down' : 'remove'}
                onPress={() => nudge(-1)}
                label={t('picker.decrease')}
              />
            )}

            {/* Сама шкала */}
            <GestureDetector gesture={pan}>
              <View
                testID="value-picker-track"
                onLayout={(event) =>
                  setSize(vertical ? event.nativeEvent.layout.height : event.nativeEvent.layout.width)
                }
                style={[
                  styles.track,
                  vertical ? { width: crossSize, height: length ?? 300 } : { height: crossSize, flex: 1 },
                  Platform.OS === 'web' && { cursor: 'grab', userSelect: 'none', touchAction: 'none' },
                ]}
              >
                <Animated.View style={[StyleSheet.absoluteFill, stripStyle]}>
                  {size > 0
                    ? indices.map((index) =>
                        variant === 'wheel' ? (
                          <WheelItem
                            key={index}
                            index={index}
                            label={labelFor(index)}
                            position={position}
                            itemSpacing={itemSpacing}
                            vertical={vertical}
                            crossSize={crossSize}
                          />
                        ) : (
                          <Tick
                            key={index}
                            index={index}
                            major={index % majorEvery === 0}
                            label={index % labelEvery === 0 ? labelFor(index) : null}
                            itemSpacing={itemSpacing}
                            vertical={vertical}
                            crossSize={crossSize}
                          />
                        ),
                      )
                    : null}
                </Animated.View>

                {/* Затухание к краям */}
                <LinearGradient
                  pointerEvents="none"
                  colors={fade}
                  start={vertical ? { x: 0, y: 0 } : { x: 0, y: 0 }}
                  end={vertical ? { x: 0, y: 1 } : { x: 1, y: 0 }}
                  style={[styles.fade, vertical ? styles.fadeTop : styles.fadeLeft]}
                />
                <LinearGradient
                  pointerEvents="none"
                  colors={fade}
                  start={vertical ? { x: 0, y: 1 } : { x: 1, y: 0 }}
                  end={vertical ? { x: 0, y: 0 } : { x: 0, y: 0 }}
                  style={[styles.fade, vertical ? styles.fadeBottom : styles.fadeRight]}
                />

                {/* Указатель текущего значения */}
                <View
                  pointerEvents="none"
                  style={[
                    styles.pointer,
                    { backgroundColor: colors.primary },
                    // указатель только над делениями, чтобы не перечёркивать подписи чисел
                    vertical
                      ? { height: 3, width: 40, left: 0, top: '50%', marginTop: -1.5 }
                      : { width: 3, height: 44, top: 4, left: '50%', marginLeft: -1.5 },
                    variant === 'wheel' && styles.pointerHidden,
                  ]}
                />
                {variant === 'wheel' ? (
                  <View
                    pointerEvents="none"
                    style={[
                      styles.wheelHighlight,
                      {
                        borderColor: colors.primary,
                        borderRadius: radius.md,
                        width: WHEEL_SPACING - 6,
                        height: crossSize - 14,
                        marginLeft: -(WHEEL_SPACING - 6) / 2,
                        marginTop: -(crossSize - 14) / 2,
                      },
                    ]}
                  />
                ) : null}
              </View>
            </GestureDetector>

            {compact ? null : (
              <StepButton
                icon={vertical ? 'chevron-up' : 'add'}
                onPress={() => nudge(1)}
                label={t('picker.increase')}
              />
            )}
          </View>
        </View>
      ) : (
        <View style={[styles.controls, vertical && styles.controlsVertical, { gap: spacing.sm }]}>
          {compact ? null : (
            <StepButton
              icon={vertical ? 'chevron-down' : 'remove'}
              onPress={() => nudge(-1)}
              label={t('picker.decrease')}
            />
          )}

          {/* Сама шкала */}
          <GestureDetector gesture={pan}>
            <View
              testID="value-picker-track"
              onLayout={(event) => setSize(vertical ? event.nativeEvent.layout.height : event.nativeEvent.layout.width)}
              style={[
                styles.track,
                vertical ? { width: crossSize, height: length ?? 300 } : { height: crossSize, flex: 1 },
                Platform.OS === 'web' && { cursor: 'grab', userSelect: 'none', touchAction: 'none' },
              ]}
            >
              <Animated.View style={[StyleSheet.absoluteFill, stripStyle]}>
                {size > 0
                  ? indices.map((index) =>
                      variant === 'wheel' ? (
                        <WheelItem
                          key={index}
                          index={index}
                          label={labelFor(index)}
                          position={position}
                          itemSpacing={itemSpacing}
                          vertical={vertical}
                          crossSize={crossSize}
                        />
                      ) : (
                        <Tick
                          key={index}
                          index={index}
                          major={index % majorEvery === 0}
                          label={index % labelEvery === 0 ? labelFor(index) : null}
                          itemSpacing={itemSpacing}
                          vertical={vertical}
                          crossSize={crossSize}
                        />
                      ),
                    )
                  : null}
              </Animated.View>

              {/* Затухание к краям */}
              <LinearGradient
                pointerEvents="none"
                colors={fade}
                start={vertical ? { x: 0, y: 0 } : { x: 0, y: 0 }}
                end={vertical ? { x: 0, y: 1 } : { x: 1, y: 0 }}
                style={[styles.fade, vertical ? styles.fadeTop : styles.fadeLeft]}
              />
              <LinearGradient
                pointerEvents="none"
                colors={fade}
                start={vertical ? { x: 0, y: 1 } : { x: 1, y: 0 }}
                end={vertical ? { x: 0, y: 0 } : { x: 0, y: 0 }}
                style={[styles.fade, vertical ? styles.fadeBottom : styles.fadeRight]}
              />

              {/* Указатель текущего значения */}
              <View
                pointerEvents="none"
                style={[
                  styles.pointer,
                  { backgroundColor: colors.primary },
                  // указатель только над делениями, чтобы не перечёркивать подписи чисел
                  vertical
                    ? { height: 3, width: 40, left: 0, top: '50%', marginTop: -1.5 }
                    : { width: 3, height: 44, top: 4, left: '50%', marginLeft: -1.5 },
                  variant === 'wheel' && styles.pointerHidden,
                ]}
              />
              {variant === 'wheel' ? (
                <View
                  pointerEvents="none"
                  style={[
                    styles.wheelHighlight,
                    {
                      borderColor: colors.primary,
                      borderRadius: radius.md,
                      width: WHEEL_SPACING - 6,
                      height: crossSize - 14,
                      marginLeft: -(WHEEL_SPACING - 6) / 2,
                      marginTop: -(crossSize - 14) / 2,
                    },
                  ]}
                />
              ) : null}
            </View>
          </GestureDetector>

          {compact ? null : (
            <StepButton icon={vertical ? 'chevron-up' : 'add'} onPress={() => nudge(1)} label={t('picker.increase')} />
          )}
        </View>
      )}
    </View>
  );
}

export const ValuePicker = memo(ValuePickerComponent);

// Деление линейки
function Tick({ index, major, label, itemSpacing, vertical, crossSize }) {
  const { colors } = useTheme();
  const tickLength = major ? 28 : 14;
  const offset = index * itemSpacing;

  return (
    <View
      pointerEvents="none"
      style={[
        styles.tick,
        vertical
          ? { top: -offset - 10, left: 0, height: 20, width: crossSize, flexDirection: 'row' }
          : { left: offset - 20, top: 0, width: 40, height: crossSize },
      ]}
    >
      <View
        style={{
          backgroundColor: major ? colors.textSecondary : colors.textTertiary,
          borderRadius: 1,
          ...(vertical ? { height: 2, width: tickLength } : { width: 2, height: tickLength, marginTop: 10 }),
        }}
      />
      {label ? (
        <AppText variant="small" color="textSecondary" style={vertical ? styles.tickLabelVertical : styles.tickLabel}>
          {label}
        </AppText>
      ) : null}
    </View>
  );
}

// Число колеса: чем дальше от центра, тем меньше и прозрачнее
function WheelItem({ index, label, position, itemSpacing, vertical, crossSize }) {
  const offset = index * itemSpacing;
  const animatedStyle = useAnimatedStyle(() => {
    const distance = Math.abs(offset - position.value) / itemSpacing;
    return {
      opacity: interpolate(distance, [0, 1, 2.5], [1, 0.45, 0.12], Extrapolation.CLAMP),
      transform: [{ scale: interpolate(distance, [0, 1, 2.5], [1, 0.68, 0.5], Extrapolation.CLAMP) }],
    };
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wheelItem,
        vertical
          ? { top: -offset - itemSpacing / 2, left: 0, width: crossSize, height: itemSpacing }
          : { left: offset - itemSpacing / 2, top: 0, width: itemSpacing, height: crossSize },
        animatedStyle,
      ]}
    >
      <AppText variant="heading">{label}</AppText>
    </Animated.View>
  );
}

// Круглая кнопка −/+
function StepButton({ icon, onPress, label }) {
  const { colors, radius, shadows } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      scaleTo={0.88}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={[styles.stepButton, { backgroundColor: colors.surface, borderRadius: radius.pill }, shadows.raised]}
    >
      <Ionicons name={icon} size={22} color={colors.primary} />
    </PressableScale>
  );
}

// Ручной ввод числа с клавиатуры
function ManualInput({ initial, unit, min, max, decimals, onDone }) {
  const { colors, typography, radius } = useTheme();
  const { t, language } = useTranslation();
  const [text, setText] = useState(initial);
  const [invalid, setInvalid] = useState(false);

  const submit = () => {
    if (text.trim() === '') {
      onDone(null);
      return;
    }
    const parsed = parseDecimal(text);
    if (parsed === null || parsed < min || parsed > max) {
      setInvalid(true);
      return;
    }
    onDone(Number(parsed.toFixed(decimals)));
  };

  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <View
        style={[
          styles.manualRow,
          { borderBottomWidth: 2, borderColor: invalid ? colors.error : colors.primary, borderRadius: radius.sm },
        ]}
      >
        <TextInput
          value={text}
          onChangeText={(next) => {
            setText(next);
            setInvalid(false);
          }}
          autoFocus
          keyboardType={decimals ? 'decimal-pad' : 'number-pad'}
          inputMode={decimals ? 'decimal' : 'numeric'}
          returnKeyType="done"
          onSubmitEditing={submit}
          onBlur={submit}
          maxLength={5}
          style={[
            typography.number,
            styles.manualInput,
            { color: colors.text },
            Platform.OS === 'web' && { outlineStyle: 'none' },
          ]}
        />
        <AppText variant="subheading" color="textSecondary">
          {unit}
        </AppText>
      </View>
      {invalid ? (
        <AppText variant="caption" color="error">
          {t('errors.outOfRange', {
            min: formatNumber(min, language, decimals),
            max: formatNumber(max, language, decimals),
            unit,
          })}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  readout: {
    alignItems: 'center',
  },
  readoutSuffix: {
    position: 'absolute',
    left: '100%',
    bottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 6,
  },
  manualRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    paddingHorizontal: 8,
  },
  readoutNumber: {
    fontSize: 48,
    lineHeight: 56,
    fontVariant: ['tabular-nums'],
  },
  manualInput: {
    fontSize: 48,
    lineHeight: 56,
    minWidth: 90,
    maxWidth: 160,
    textAlign: 'center',
    padding: 0,
  },
  asideRow: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  aside: {
    flex: 1,
    alignItems: 'center',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
  },
  controlsVertical: {
    flexDirection: 'column-reverse',
    alignSelf: 'center',
  },
  track: {
    overflow: 'hidden',
  },
  tick: {
    position: 'absolute',
    alignItems: 'center',
  },
  tickLabel: {
    marginTop: 6,
  },
  tickLabelVertical: {
    marginLeft: 8,
    lineHeight: 20,
  },
  wheelItem: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fade: {
    position: 'absolute',
  },
  fadeLeft: { left: 0, top: 0, bottom: 0, width: 72 },
  fadeRight: { right: 0, top: 0, bottom: 0, width: 72 },
  fadeTop: { top: 0, left: 0, right: 0, height: 72 },
  fadeBottom: { bottom: 0, left: 0, right: 0, height: 72 },
  pointer: {
    position: 'absolute',
    borderRadius: 2,
  },
  pointerHidden: {
    opacity: 0,
  },
  wheelHighlight: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    borderWidth: 2,
  },
  stepButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
