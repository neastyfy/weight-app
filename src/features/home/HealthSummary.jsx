// Показатели здоровья на Главной: ИМТ, BMR, активность (HealthSummary) и последняя талия (BodySummary).
// Все расчёты — из общего модуля (useProfile().metrics), формулы здесь не повторяются.
import { router } from 'expo-router';
import { View } from 'react-native';

import { AppText, Card, IconBadge, ListRow, RangeScale, SectionHeader, StatCard } from '@/components';
import { ActivityLevelView } from '@/features/metrics/ActivityLevelView';
import { BMI_SCALE, BMI_TONES, getBmiScalePosition } from '@/features/metrics/metricTones';
import { useProfile } from '@/features/profile';
import { useTranslation } from '@/i18n';
import { formatCircumference, formatDate, formatNumber } from '@/lib/format';
import { useTheme } from '@/theme';

// Показатели здоровья — сразу под карточкой «Текущий вес»
export function HealthSummary() {
  const { t, language } = useTranslation();
  const { spacing } = useTheme();
  const { metrics } = useProfile();

  return (
    <View style={{ gap: spacing.sm }}>
      <SectionHeader title={t('home.healthTitle')} linkLabel={t('home.details')} onLinkPress={() => router.push('/metrics')} />

      <View style={{ flexDirection: 'row', gap: spacing.sm }}>
        <StatCard
          style={{ flex: 1 }}
          icon="body-outline"
          iconTone="success"
          label={t('bmi.title')}
          value={metrics.bmi ? formatNumber(metrics.bmi, language, 1) : '-'}
          caption={metrics.bmiCategory ? t(`bmi.categories.${metrics.bmiCategory}`) : metrics.bmi ? t('bmi.adultsOnly') : null}
          captionColor={metrics.bmiCategory ? `${BMI_TONES[metrics.bmiCategory]}Text` : 'textSecondary'}
        >
          {metrics.bmi ? (
            <RangeScale
              compact
              segments={BMI_SCALE.segments.map((zone) => ({ size: zone.to - zone.from, tone: zone.tone }))}
              position={getBmiScalePosition(metrics.bmi)}
              style={{ marginTop: spacing.xxs }}
            />
          ) : null}
        </StatCard>
        <StatCard
          style={{ flex: 1 }}
          icon="flame-outline"
          iconTone="warning"
          label={t('bmr.title')}
          value={metrics.bmr ? `≈ ${formatNumber(metrics.bmr, language, 0)}` : '-'}
          unit={metrics.bmr ? t('bmr.unit') : null}
          caption={metrics.bmr ? t('bmr.estimate') : t(`bmr.unavailable.${metrics.bmrUnavailableReason}`)}
        />
      </View>

      <Card style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <IconBadge icon="walk-outline" tone="primary" />
        <View style={{ flex: 1 }}>
          <ActivityLevelView level={metrics.activityLevel} />
        </View>
      </Card>

      <AppText variant="small" color="textTertiary" align="center">
        {t('home.disclaimer')}
      </AppText>
    </View>
  );
}

// Окружности тела внизу Главной: последняя талия и переход к подробностям.
// latestWaist — последняя запись талии или null
export function BodySummary({ latestWaist }) {
  const { t, language } = useTranslation();
  const { spacing } = useTheme();
  const { profile } = useProfile();
  const lengthUnit = profile.heightUnit;

  return (
    <View style={{ gap: spacing.sm }}>
      <SectionHeader title={t('body.title')} linkLabel={t('home.details')} onLinkPress={() => router.push('/body')} />
      <Card style={{ gap: 0, paddingVertical: spacing.xxs }}>
        <ListRow
          icon="ellipse-outline"
          iconTone={latestWaist ? 'success' : 'primary'}
          title={t('body.types.waist')}
          subtitle={latestWaist ? formatDate(latestWaist.measuredAt, language) : t('body.noData')}
          value={latestWaist ? `${formatCircumference(latestWaist.valueCm, lengthUnit, language)} ${t(`units.${lengthUnit}`)}` : null}
          onPress={() => router.push('/body/waist')}
        />
      </Card>
    </View>
  );
}
