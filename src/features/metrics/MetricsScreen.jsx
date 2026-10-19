// Экран «Показатели» (как в референсе): ИМТ со шкалой, BMR и категория активности,
// у каждого — короткое пояснение. Кнопка «Подробнее о показателях» открывает объяснение,
// как они считаются и чего не учитывают. Все расчёты — из общего модуля (useProfile().metrics).
// Это ориентиры, а не диагноз: тексты нигде не делают медицинских выводов.
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText, Button, Card, PressableScale, RangeScale, Screen, ScreenHeader, Sheet } from '@/components';
import { ACTIVITY_LEVELS } from '@/features/calculations';
import { useProfile } from '@/features/profile';
import { useTranslation } from '@/i18n';
import { formatHeight, formatNumber, formatWeight } from '@/lib/format';
import { useTheme } from '@/theme';

import { ACTIVITY_TONES, BMI_SCALE, BMI_TONES, getBmiScalePosition } from './metricTones';

// Подписи под шкалой ИМТ: края и границы категорий ВОЗ
const BMI_LABEL_VALUES = [BMI_SCALE.min, 18.5, 25, 30, BMI_SCALE.max];

export function MetricsScreen() {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const [infoOpen, setInfoOpen] = useState(false);

  return (
    <Screen pushed>
      <ScreenHeader title={t('metricsScreen.title')} showBack />
      <BmiCard />
      <BmrCard />
      <ActivityCard />
      <Button title={t('metricsScreen.more')} variant="secondary" icon="information-circle-outline" onPress={() => setInfoOpen(true)} />
      <AppText variant="small" color="textTertiary" align="center" style={{ marginTop: -spacing.xs }}>
        {t('home.disclaimer')}
      </AppText>
      {infoOpen ? <InfoSheet onClose={() => setInfoOpen(false)} /> : null}
    </Screen>
  );
}

// Круглый значок справа в карточке (как в референсе)
function RoundBadge({ icon, tone }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: colors[`${tone}Soft`],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={28} color={colors[tone]} />
    </View>
  );
}

function BmiCard() {
  const { t, language } = useTranslation();
  const { spacing } = useTheme();
  const { profile, metrics, latestWeight } = useProfile();
  const { bmi, bmiCategory } = metrics;
  const tone = bmiCategory ? BMI_TONES[bmiCategory] : 'primary';

  // Пояснение: по категории; для подростков и без данных — свои тексты
  const textKey = !bmi ? 'noData' : bmiCategory ?? 'teen';
  const toPosition = (value) => getBmiScalePosition(value);

  return (
    <Card style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="small" color="textSecondary">
            {t('metricsScreen.bmiTitle')}
          </AppText>
          <AppText variant="number">{bmi ? formatNumber(bmi, language, 1) : '-'}</AppText>
          {bmi ? (
            <AppText variant="subheading" color={bmiCategory ? `${tone}Text` : 'textSecondary'}>
              {bmiCategory ? t(`bmi.categories.${bmiCategory}`) : t('bmi.adultsOnly')}
            </AppText>
          ) : null}
        </View>
        <RoundBadge icon="body" tone={bmiCategory ? tone : 'primary'} />
      </View>

      {bmi ? (
        <RangeScale
          segments={BMI_SCALE.segments.map((zone) => ({ size: zone.to - zone.from, tone: zone.tone }))}
          position={toPosition(bmi)}
          labels={BMI_LABEL_VALUES.map((value) => ({ at: toPosition(value), text: formatNumber(value, language, 1) }))}
        />
      ) : null}

      <AppText variant="caption" color="textSecondary">
        {t(`metricsScreen.bmiText.${textKey}`)}
      </AppText>
      {bmi && latestWeight ? (
        <AppText variant="small" color="textTertiary">
          {t('metricsScreen.bmiBasis', {
            weight: `${formatWeight(latestWeight.weightKg, profile.weightUnit, language)} ${t(`units.${profile.weightUnit}`)}`,
            height: `${formatHeight(profile.heightCm, profile.heightUnit, language)} ${t(`units.${profile.heightUnit}`)}`,
          })}
        </AppText>
      ) : null}
    </Card>
  );
}

function BmrCard() {
  const { t, language } = useTranslation();
  const { colors, spacing } = useTheme();
  const { metrics } = useProfile();
  const { bmr, bmrUnavailableReason } = metrics;

  return (
    <Card style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
        <Ionicons name="flame" size={30} color={colors.warning} style={{ marginTop: 2 }} />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="small" color="textSecondary">
            {t('bmr.title')}
          </AppText>
          <AppText variant="number">{bmr ? `≈ ${formatNumber(bmr, language, 0)}` : '-'}</AppText>
          {bmr ? (
            <AppText variant="subheading" color="warningText">
              {t('bmr.unit')}
            </AppText>
          ) : null}
        </View>
        <RoundBadge icon="calculator-outline" tone="purple" />
      </View>

      <AppText variant="caption" color="textSecondary">
        {bmr ? t('metricsScreen.bmrText') : t(`metricsScreen.bmrUnavailable.${bmrUnavailableReason}`)}
      </AppText>
      {/* Нет пола — можно указать в настройках, оценка появится сразу */}
      {!bmr && bmrUnavailableReason === 'noSex' ? (
        <Button title={t('metricsScreen.setSex')} variant="secondary" icon="person-outline" onPress={() => router.push('/settings/profile/sex')} />
      ) : null}
    </Card>
  );
}

function ActivityCard() {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();
  const { metrics } = useProfile();
  const level = metrics.activityLevel;
  const tone = ACTIVITY_TONES[level];

  return (
    <PressableScale onPress={() => router.push('/settings/profile/activity')} scaleTo={0.98} accessibilityRole="button">
      <Card style={{ gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm }}>
          <Ionicons name="walk" size={30} color={colors.primary} style={{ marginTop: 2 }} />
          <View style={{ flex: 1, gap: 2 }}>
            <AppText variant="small" color="textSecondary">
              {t('onboarding.activity.resultLabel')}
            </AppText>
            <AppText variant="heading" color={`${tone}Text`}>
              {t(`activity.levels.${level}`)}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} style={{ marginTop: 6 }} />
        </View>
        <RangeScale
          segments={ACTIVITY_LEVELS.map((item) => ({ size: 1, tone: ACTIVITY_TONES[item] }))}
          position={(ACTIVITY_LEVELS.indexOf(level) + 0.5) / ACTIVITY_LEVELS.length}
        />
        <AppText variant="caption" color="textSecondary">
          {t(`activity.levelHints.${level}`)} {t('metricsScreen.activityBasis')}
        </AppText>
      </Card>
    </PressableScale>
  );
}

// «Подробнее о показателях»: как считаются и чего не учитывают
function InfoSheet({ onClose }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  return (
    <Sheet visible onClose={onClose} title={t('metricsScreen.more')}>
      <View style={{ gap: spacing.md }}>
        {['bmi', 'bmr', 'activity'].map((key) => (
          <View key={key} style={{ gap: spacing.xxs }}>
            <AppText variant="subheading">{t(`metricsScreen.info.${key}.title`)}</AppText>
            <AppText variant="caption" color="textSecondary">
              {t(`metricsScreen.info.${key}.text`)}
            </AppText>
          </View>
        ))}
        <AppText variant="small" color="textTertiary">
          {t('metricsScreen.info.note')}
        </AppText>
      </View>
      <Button title={t('common.done')} icon="checkmark" onPress={onClose} />
    </Sheet>
  );
}
