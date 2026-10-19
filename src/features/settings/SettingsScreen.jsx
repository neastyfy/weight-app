// Настройки: профиль, цель, внешний вид (язык и тема), единицы, напоминание и данные.
// Открываются шестерёнкой на Главной и строкой «Настройки» во вкладке «Ещё».
// Всё сохраняется в базе и восстанавливается при следующем запуске.
import { router } from 'expo-router';
import { View } from 'react-native';

import { AppText, Card, ListRow, Screen, ScreenHeader, SectionHeader, SegmentedControl } from '@/components';
import { NicknameCard } from '@/features/profile/NicknameCard';
import { ProfileCard } from '@/features/profile/ProfileCard';
import { useProfile } from '@/features/profile';
import { ReminderCard } from '@/features/reminders/ReminderCard';
import { LANGUAGES, useTranslation } from '@/i18n';
import { formatHeight, formatWeight } from '@/lib/format';
import { HEIGHT_UNITS, WEIGHT_UNITS } from '@/lib/units';
import { THEME_MODES, useTheme } from '@/theme';
import { logError } from '@/lib/logError';

export function SettingsScreen() {
  const { t, language } = useTranslation();
  const { spacing, mode, setMode } = useTheme();
  const { profile, metrics, updateProfile } = useProfile();

  const heightText = `${formatHeight(profile.heightCm, profile.heightUnit, language)} ${t(`units.${profile.heightUnit}`)}`;
  const goalText =
    profile.goalType === 'none' || profile.targetWeightKg == null
      ? t('goal.types.none')
      : `${formatWeight(profile.targetWeightKg, profile.weightUnit, language)} ${t(`units.${profile.weightUnit}`)}`;
  const currentLanguage = LANGUAGES.find((item) => item.code === language);

  // Единицы — только отображение: сохранённые значения (кг, см) не меняются
  const changeUnits = (changes) => updateProfile(changes).catch((error) => logError('Не удалось сменить единицы', error));

  return (
    <Screen pushed>
      <ScreenHeader title={t('settings.title')} showBack />

      {/* Профиль */}
      <ProfileCard />
      <NicknameCard />
      <Card style={{ gap: 0, paddingVertical: spacing.xxs }}>
        <ListRow icon="happy-outline" iconTone="warning" title={t('onboarding.fields.mascot')} value={t(`mascots.${profile.mascotId}.name`)} onPress={() => router.push('/settings/profile/mascot')} />
        <ListRow divider icon="resize-outline" title={t('onboarding.fields.height')} value={heightText} onPress={() => router.push('/settings/profile/height')} />
        <ListRow
          divider
          icon="calendar-outline"
          iconTone="purple"
          title={t('onboarding.fields.age')}
          value={`${metrics.ageYears} ${t('onboarding.age.unit')}`}
          onPress={() => router.push('/settings/profile/age')}
        />
        <ListRow
          divider
          icon="person-outline"
          iconTone="pink"
          title={t('onboarding.fields.sex')}
          value={t(`onboarding.sex.${profile.sex ?? 'none'}`)}
          onPress={() => router.push('/settings/profile/sex')}
        />
        <ListRow
          divider
          icon="walk-outline"
          iconTone="success"
          title={t('onboarding.fields.activity')}
          value={t(`activity.levels.${metrics.activityLevel}`)}
          onPress={() => router.push('/settings/profile/activity')}
        />
        <ListRow divider icon="flag-outline" iconTone="warning" title={t('goal.editTitle')} value={goalText} onPress={() => router.push('/goal/edit')} />
      </Card>
      <AppText variant="small" color="textTertiary" align="center">
        {t('settings.profileNote')}
      </AppText>

      {/* Внешний вид */}
      <View style={{ gap: spacing.sm }}>
        <SectionHeader title={t('settings.appearance')} />
        <Card style={{ gap: 0, paddingVertical: spacing.xxs }}>
          <ListRow
            icon="language-outline"
            title={t('settings.language')}
            value={currentLanguage?.nativeName}
            onPress={() => router.push('/settings/language')}
          />
        </Card>
        <Card style={{ gap: spacing.xs }}>
          <AppText variant="subheading">{t('settings.theme.title')}</AppText>
          <SegmentedControl
            options={THEME_MODES.map((value) => ({ value, label: t(`settings.theme.${value}`) }))}
            value={mode}
            onChange={setMode}
          />
        </Card>
      </View>

      {/* Единицы */}
      <View style={{ gap: spacing.sm }}>
        <SectionHeader title={t('onboarding.units.title')} />
        <Card style={{ gap: spacing.md }}>
          <View style={{ gap: spacing.xs }}>
            <AppText variant="subheading">{t('onboarding.units.weight')}</AppText>
            <SegmentedControl
              options={WEIGHT_UNITS.map((unit) => ({ value: unit, label: t(`unitNames.${unit}`) }))}
              value={profile.weightUnit}
              onChange={(weightUnit) => changeUnits({ weightUnit })}
            />
          </View>
          <View style={{ gap: spacing.xs }}>
            <AppText variant="subheading">{t('settings.lengthUnits')}</AppText>
            <SegmentedControl
              options={HEIGHT_UNITS.map((unit) => ({ value: unit, label: t(`unitNames.${unit}`) }))}
              value={profile.heightUnit}
              onChange={(heightUnit) => changeUnits({ heightUnit })}
            />
          </View>
          <AppText variant="small" color="textTertiary">
            {t('settings.unitsNote')}
          </AppText>
        </Card>
      </View>

      {/* Напоминание */}
      <ReminderCard />

      {/* Данные */}
      <Card style={{ gap: 0, paddingVertical: spacing.xxs }}>
        <ListRow icon="server-outline" iconTone="primary" title={t('data.title')} subtitle={t('data.subtitle')} onPress={() => router.push('/settings/data')} />
      </Card>
    </Screen>
  );
}
