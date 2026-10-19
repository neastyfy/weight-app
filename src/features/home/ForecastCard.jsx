// Прогноз достижения цели на Главной (только похудение и набор, пока цель не достигнута).
// Считается по тем же записям текущей цели, что и полоса прогресса (см. getGoalForecast).
// Прогноз показывается даже при колебаниях и малом количестве данных — с пометкой, что он приблизительный.
// Если прогноза нет — честное пояснение почему. Цель и прогресс — в карточке «Текущий вес».
import { View } from 'react-native';

import { AppText, Card, IconBadge } from '@/components';
import { useProfile } from '@/features/profile';
import { useTranslation } from '@/i18n';
import { formatDate, formatFullDate, formatNumber, formatSignedChange } from '@/lib/format';
import { fromKg } from '@/lib/units';
import { useTheme } from '@/theme';

// forecast — из getGoalForecast
export function ForecastCard({ forecast }) {
  const { t, language } = useTranslation();
  const { spacing } = useTheme();
  const { profile, goalProgress } = useProfile();
  if (!forecast || goalProgress !== 'inProgress' || forecast.status === 'notApplicable' || forecast.status === 'reached') {
    return null;
  }

  const unit = profile.weightUnit;
  const ok = forecast.status === 'ok';

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <IconBadge icon="calendar-outline" tone="purple" size={40} />
        <AppText variant="subheading" style={{ flex: 1 }}>
          {t('forecast.title')}
        </AppText>
      </View>
      <AppText variant="caption">{t(ok ? 'forecast.ok' : `forecast.${forecast.status}`)}</AppText>
      {ok ? (
        <>
          {/* Сколько дней осталось и примерная дата — две крупные цифры рядом */}
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <ForecastFigure label={t('forecast.daysLeft')} value={`≈ ${formatNumber(forecast.daysLeft, language)}`} />
            <ForecastFigure label={t('forecast.date')} value={`~ ${formatDate(forecast.expectedDate.toISOString(), language)}`} />
          </View>
          {/* Мало данных или сильные колебания — прогноз всё равно показываем, но честно помечаем */}
          {forecast.confidence === 'low' ? (
            <AppText variant="caption" color="cautionText">
              {t('forecast.lowConfidence')}
            </AppText>
          ) : null}
          <AppText variant="caption" color="textSecondary">
            {t('forecast.dateRange', {
              from: formatDate(forecast.earliestDate.toISOString(), language),
              to: formatFullDate(forecast.latestDate.toISOString(), language),
            })}
          </AppText>
          <AppText variant="caption" color="textSecondary">
            {t('forecast.rate', {
              value: formatSignedChange(fromKg(forecast.rateKgPerWeek, unit), language),
              unit: t(`units.${unit}`),
            })}
          </AppText>
          <AppText variant="small" color="textTertiary">
            {t('forecast.note')}
          </AppText>
        </>
      ) : null}
    </Card>
  );
}

// Крупная цифра прогноза с подписью сверху
function ForecastFigure({ label, value }) {
  const { colors, radius, spacing } = useTheme();
  return (
    <View style={{ flex: 1, padding: spacing.sm, borderRadius: radius.md, backgroundColor: colors.primarySoft, gap: 2 }}>
      <AppText variant="small" color="textSecondary">
        {label}
      </AppText>
      <AppText variant="heading" color="primary">
        {value}
      </AppText>
    </View>
  );
}
