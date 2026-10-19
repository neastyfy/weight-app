// Поле «Дата и время» для измерений. Нажатие открывает панель с календарём
// (будущие дни недоступны) и колёсами часов и минут.
// Работает одинаково на iOS и в браузере.
// Пример: <DateTimeField value={measuredAt} onChange={setMeasuredAt} />  (value — Date)
// mode="date" — только дата, без часов и минут (возвращает начало выбранного дня).
import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useTranslation } from '@/i18n';
import { addDays, combineDateAndTime, getMonthGrid, isSameDay, startOfDay } from '@/lib/dates';
import { capitalizeFirst, getLocale } from '@/lib/format';
import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';
import { PressableScale } from './PressableScale';
import { Sheet } from './Sheet';
import { ValuePicker } from './ValuePicker';

const pad = (n) => String(n).padStart(2, '0');

export function DateTimeField({ label, value, onChange, error, mode = 'datetime' }) {
  const withTime = mode !== 'date';
  const { t, language } = useTranslation();
  const { colors, radius, spacing, layout } = useTheme();
  const [open, setOpen] = useState(false);

  const locale = getLocale(language);
  const today = new Date();
  const dayLabel = isSameDay(value, today)
    ? t('common.today')
    : isSameDay(value, addDays(today, -1))
      ? t('common.yesterday')
      : new Intl.DateTimeFormat(locale, {
          day: 'numeric',
          month: 'long',
          year: value.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
        }).format(value);

  return (
    <View style={{ gap: spacing.xs }}>
      {label ? (
        <AppText variant="small" color="textSecondary">
          {label}
        </AppText>
      ) : null}
      <PressableScale
        onPress={() => setOpen(true)}
        scaleTo={0.98}
        accessibilityRole="button"
        accessibilityLabel={
          withTime
            ? `${label ?? ''} ${dayLabel} ${pad(value.getHours())}:${pad(value.getMinutes())}`
            : `${label ?? ''} ${dayLabel}`
        }
        style={[
          styles.field,
          {
            height: layout.inputHeight,
            borderRadius: radius.md,
            paddingHorizontal: spacing.md,
            backgroundColor: colors.surface,
            borderColor: error ? colors.error : colors.border,
            gap: spacing.sm,
          },
        ]}
      >
        <Ionicons name="calendar-outline" size={20} color={colors.primary} />
        <AppText style={{ flex: 1 }}>{dayLabel}</AppText>
        {withTime ? <AppText variant="subheading">{`${pad(value.getHours())}:${pad(value.getMinutes())}`}</AppText> : null}
      </PressableScale>
      {error ? (
        <AppText variant="caption" color="error">
          {error}
        </AppText>
      ) : null}

      {open ? (
        <DateTimeSheet
          initial={value}
          withTime={withTime}
          onClose={() => setOpen(false)}
          onDone={(date) => {
            setOpen(false);
            onChange(date);
          }}
        />
      ) : null}
    </View>
  );
}

// Панель выбора: календарь + часы и минуты
function DateTimeSheet({ initial, withTime, onClose, onDone }) {
  const { t, language } = useTranslation();
  const { colors, radius, spacing } = useTheme();
  const locale = getLocale(language);

  const [day, setDay] = useState(startOfDay(initial));
  const [month, setMonth] = useState({
    year: initial.getFullYear(),
    month: initial.getMonth(),
  });
  const [hours, setHours] = useState(initial.getHours());
  const [minutes, setMinutes] = useState(initial.getMinutes());

  const today = startOfDay(new Date());
  const weeks = getMonthGrid(month.year, month.month);
  const monthTitle = capitalizeFirst(
    new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(month.year, month.month, 1)),
  );
  const weekdayNames = Array.from(
    { length: 7 },
    (_, i) => new Intl.DateTimeFormat(locale, { weekday: 'short' }).format(new Date(2024, 0, 1 + i)), // 1 января 2024 — понедельник
  );
  const canGoNext = new Date(month.year, month.month + 1, 1) <= today;

  const shiftMonth = (delta) =>
    setMonth(({ year, month: m }) => {
      const date = new Date(year, m + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });

  // Нельзя выбрать время в будущем: для сегодняшнего дня ограничиваем текущим моментом
  const done = () => {
    if (!withTime) {
      onDone(day);
      return;
    }
    const now = new Date();
    const chosen = combineDateAndTime(day, hours, minutes);
    onDone(chosen > now ? now : chosen);
  };

  return (
    <Sheet visible onClose={onClose} title={t(withTime ? 'datetime.title' : 'datetime.dateTitle')}>
      {/* Месяц */}
      <View style={styles.monthRow}>
        <NavButton icon="chevron-back" onPress={() => shiftMonth(-1)} label={t('datetime.previousMonth')} />
        <AppText variant="subheading" style={styles.monthTitle}>
          {monthTitle}
        </AppText>
        <NavButton icon="chevron-forward" onPress={() => shiftMonth(1)} disabled={!canGoNext} label={t('datetime.nextMonth')} />
      </View>

      {/* Дни недели и календарь */}
      <View style={{ gap: 4 }}>
        <View style={styles.week}>
          {weekdayNames.map((name) => (
            <AppText key={name} variant="small" color="textTertiary" align="center" style={styles.cell}>
              {name}
            </AppText>
          ))}
        </View>
        {weeks.map((week, w) => (
          <View key={w} style={styles.week}>
            {week.map((date, d) => {
              if (!date) return <View key={d} style={styles.cell} />;
              const selected = isSameDay(date, day);
              const disabled = date > today;
              const isToday = isSameDay(date, today);
              return (
                <View key={d} style={styles.cell}>
                  <PressableScale
                    onPress={() => setDay(date)}
                    disabled={disabled}
                    scaleTo={0.9}
                    accessibilityRole="button"
                    accessibilityState={{ selected, disabled }}
                    style={[
                      styles.day,
                      { borderRadius: radius.pill },
                      selected && { backgroundColor: colors.primary },
                      !selected &&
                        isToday && {
                          borderWidth: 1.5,
                          borderColor: colors.primary,
                        },
                    ]}
                  >
                    <AppText variant="subheading" color={selected ? 'textOnPrimary' : disabled ? 'disabledText' : 'text'}>
                      {date.getDate()}
                    </AppText>
                  </PressableScale>
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {/* Время */}
      {withTime ? (
        <View style={{ gap: spacing.xs }}>
          <AppText variant="small" color="textSecondary">
            {t('datetime.hours')}
          </AppText>
          <ValuePicker
            compact
            variant="wheel"
            value={hours}
            onChange={setHours}
            min={0}
            max={23}
            step={1}
            unit=""
            formatLabel={pad}
            fadeColor={colors.background}
          />
          <AppText variant="small" color="textSecondary">
            {t('datetime.minutes')}
          </AppText>
          <ValuePicker
            compact
            variant="wheel"
            value={minutes}
            onChange={setMinutes}
            min={0}
            max={59}
            step={1}
            unit=""
            formatLabel={pad}
            fadeColor={colors.background}
          />
        </View>
      ) : null}

      <Button title={t('common.done')} icon="checkmark" onPress={done} />
    </Sheet>
  );
}

function NavButton({ icon, onPress, disabled, label }) {
  const { colors, radius } = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      disabled={disabled}
      scaleTo={0.88}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        styles.nav,
        {
          borderRadius: radius.pill,
          backgroundColor: colors.surface,
          opacity: disabled ? 0.35 : 1,
        },
      ]}
    >
      <Ionicons name={icon} size={20} color={colors.text} />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthTitle: {
    flex: 1,
    textAlign: 'center',
  },
  week: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
  },
  day: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nav: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
