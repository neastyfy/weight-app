// Стрик: сколько дней подряд есть записи веса, рекорд и отметки за последние 7 дней.
// Засчитываются только записи, внесённые в тот же день (задним числом — нет), см. getStreak.
// Без упрёков в тексте: если серия прервалась, просто предлагаем начать новую.
import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';

import { AppText, Card, IconBadge } from '@/components';
import { useTranslation } from '@/i18n';
import { getLocale } from '@/lib/format';
import { useTheme } from '@/theme';

// streak — из getStreak
export function StreakCard({ streak }) {
  const { t, language } = useTranslation();
  const { spacing } = useTheme();
  const weekday = new Intl.DateTimeFormat(getLocale(language), { weekday: 'short' });

  const hint = streak.weighedToday ? 'hintToday' : streak.current > 0 ? 'hintContinue' : 'hintStart';

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <IconBadge icon="flame" tone="warning" />
        <View style={{ flex: 1 }}>
          <AppText variant="small" color="textSecondary">
            {t('streak.title')}
          </AppText>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs }}>
            {/* «Дней подряд: 5» — без склонений, одинаково для всех языков */}
            <AppText variant="caption" color="textSecondary">
              {t('streak.daysInRow')}:
            </AppText>
            <AppText variant="heading">{streak.current}</AppText>
          </View>
        </View>
        <AppText variant="small" color="textTertiary">
          {t('streak.best', { count: streak.best })}
        </AppText>
      </View>

      {/* Последние 7 дней, сегодня — справа */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {streak.week.map((day, index) => (
          <DayMark key={index} label={weekday.format(day.date)} state={day.state} isToday={index === streak.week.length - 1} />
        ))}
      </View>

      <AppText variant="caption" color={streak.weighedToday ? 'successText' : 'textSecondary'}>
        {t(`streak.${hint}`)}
      </AppText>
    </Card>
  );
}

// Кружок дня. state — из getStreak:
//   done — зелёный с галочкой, missed — красный с крестиком,
//   pending — сегодня без записи: синяя обводка, beforeStart — до создания профиля: без цвета
const DAY_STYLES = {
  done: { background: 'success', icon: 'checkmark' },
  missed: { background: 'error', icon: 'close' },
  pending: { background: 'surfaceMuted', border: 'primary' },
  beforeStart: { background: 'surfaceMuted' },
};

function DayMark({ label, state, isToday }) {
  const { colors, radius } = useTheme();
  const look = DAY_STYLES[state];
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors[look.background],
          borderWidth: look.border ? 2 : 0,
          borderColor: look.border ? colors[look.border] : undefined,
          opacity: state === 'beforeStart' ? 0.5 : 1,
        }}
      >
        {look.icon ? <Ionicons name={look.icon} size={18} color={colors.textOnPrimary} /> : null}
      </View>
      <AppText variant="small" color={isToday ? 'primary' : 'textTertiary'}>
        {label}
      </AppText>
    </View>
  );
}
