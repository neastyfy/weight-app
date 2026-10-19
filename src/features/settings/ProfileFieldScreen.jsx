// Изменение одного параметра профиля после онбординга: маскот, рост, возраст, пол, активность.
// Переиспользует шаги онбординга — тот же вид и те же проверки.
// Рост, возраст, пол и активность влияют на расчёты: изменение сохраняется новой версией
// профиля с сегодняшней датой, а прошлые записи считаются по прежним значениям.
import { Redirect, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { View } from 'react-native';

import { AppText, Button, Card, Screen, ScreenHeader } from '@/components';
import { ActivityFooter, ActivityStep } from '@/features/onboarding/steps/ActivityStep';
import { AgeStep } from '@/features/onboarding/steps/AgeStep';
import { HeightStep } from '@/features/onboarding/steps/HeightStep';
import { MascotStep } from '@/features/onboarding/steps/MascotStep';
import { SexStep } from '@/features/onboarding/steps/SexStep';
import { PICKERS, useProfile, validateAge, validateHeight } from '@/features/profile';
import { useTranslation } from '@/i18n';
import { fromCm, roundTo, toCm } from '@/lib/units';
import { useTheme } from '@/theme';
import { logError } from '@/lib/logError';

// Поля: шаг онбординга, заголовок, проверка и как превратить черновик в изменения профиля
export const PROFILE_FIELDS = {
  mascot: { Component: MascotStep, titleKey: 'onboarding.fields.mascot', toChanges: (d) => ({ mascotId: d.mascotId }) },
  height: {
    Component: HeightStep,
    titleKey: 'onboarding.fields.height',
    scroll: false,
    versioned: true,
    validate: (d) => ({ height: validateHeight(d.height, d.heightUnit) }),
    toChanges: (d) => ({ heightCm: roundTo(toCm(d.height, d.heightUnit), 1) }),
  },
  age: {
    Component: AgeStep,
    titleKey: 'onboarding.fields.age',
    versioned: true,
    validate: (d) => ({ age: validateAge(d.age) }),
    toChanges: (d) => ({ ageYears: d.age }),
  },
  sex: { Component: SexStep, titleKey: 'onboarding.fields.sex', versioned: true, toChanges: (d) => ({ sex: d.sex ?? null }) },
  activity: {
    Component: ActivityStep,
    Footer: ActivityFooter,
    titleKey: 'onboarding.fields.activity',
    versioned: true,
    toChanges: (d) => ({ activityAnswers: d.activityAnswers }),
  },
};

// Черновик в формате шагов онбординга из текущего профиля
function draftFromProfile(profile) {
  const picker = PICKERS.height[profile.heightUnit];
  return {
    mascotId: profile.mascotId,
    heightUnit: profile.heightUnit,
    height: roundTo(fromCm(profile.heightCm, profile.heightUnit), picker.step < 1 ? 1 : 0),
    age: profile.ageYears,
    sex: profile.sex,
    activityAnswers: [...profile.activityAnswers],
  };
}

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/settings');
}

export function ProfileFieldScreen({ field }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const { profile, updateProfile } = useProfile();
  const config = PROFILE_FIELDS[field];
  const [draft, setDraft] = useState(() => draftFromProfile(profile));
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [failed, setFailed] = useState(false);

  // Шаги вызывают update(патч) или update(текущий => патч)
  const update = useCallback((patch) => {
    setDraft((current) => ({ ...current, ...(typeof patch === 'function' ? patch(current) : patch) }));
    setErrors({});
  }, []);

  if (!config) return <Redirect href="/settings" />;

  const save = async () => {
    const found = Object.fromEntries(Object.entries(config.validate?.(draft) ?? {}).filter(([, error]) => error));
    setErrors(found);
    if (Object.keys(found).length) return;
    setSaving(true);
    setFailed(false);
    try {
      await updateProfile(config.toChanges(draft));
      goBack();
    } catch (error) {
      logError('Не удалось сохранить профиль', error);
      setFailed(true);
      setSaving(false);
    }
  };

  const { Component, Footer } = config;
  return (
    <Screen pushed scroll={config.scroll !== false}>
      <ScreenHeader title={t(config.titleKey)} showBack />
      <View style={config.scroll === false ? { flex: 1, justifyContent: 'center' } : null}>
        <Component draft={draft} update={update} errors={errors} onSubmit={save} />
      </View>
      {Footer ? (
        <Card>
          <Footer draft={draft} />
        </Card>
      ) : null}
      {config.versioned ? (
        <AppText variant="small" color="textTertiary" align="center">
          {t('settings.versionNote')}
        </AppText>
      ) : null}
      {failed ? (
        <AppText variant="caption" color="error" align="center">
          {t('errors.saveFailed')}
        </AppText>
      ) : null}
      <Button title={saving ? t('common.saving') : t('common.save')} icon="checkmark" onPress={save} disabled={saving} style={{ marginTop: spacing.xs }} />
    </Screen>
  );
}
