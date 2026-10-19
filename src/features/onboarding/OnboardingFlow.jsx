// Онбординг: пошаговое создание профиля при первом запуске.
// Хранит черновик ответов, номер шага и проверяет поля перед переходом дальше.
// После подтверждения сохраняет профиль — и приложение само открывает Главную.
import { useCallback, useState } from 'react';

import { useTranslation } from '@/i18n';
import { buildProfileFromDraft, createEmptyDraft, useProfile, validateDraft } from '@/features/profile';
import { logError } from '@/lib/logError';

import { OnboardingLayout } from './OnboardingLayout';
import { STEPS, SUMMARY_STEP_INDEX } from './steps';

const PROGRESS_STEPS = STEPS.filter((step) => step.progress);

export function OnboardingFlow() {
  const { t } = useTranslation();
  const { saveNewProfile } = useProfile();

  const [draft, setDraft] = useState(createEmptyDraft);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState('forward'); // для анимации перехода
  const [showErrors, setShowErrors] = useState(false); // ошибки видны после первой попытки «Далее»
  const [returnToSummary, setReturnToSummary] = useState(false); // правка пункта из итогового экрана
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(false);

  const step = STEPS[stepIndex];
  const allErrors = validateDraft(draft);
  const stepErrors = Object.fromEntries(step.fields.filter((field) => allErrors[field]).map((f) => [f, allErrors[f]]));
  const hasStepErrors = Object.keys(stepErrors).length > 0;

  // Изменение черновика: update({ nickname: 'Алекс' }) или update((draft) => новый черновик)
  const update = useCallback(
    (change) => setDraft((current) => (typeof change === 'function' ? change(current) : { ...current, ...change })),
    [],
  );

  const goTo = (index) => {
    setDirection(index < stepIndex ? 'back' : 'forward');
    setShowErrors(false);
    setStepIndex(index);
  };

  const goNext = () => {
    if (hasStepErrors) {
      setShowErrors(true);
      return;
    }
    if (returnToSummary) {
      setReturnToSummary(false);
      goTo(SUMMARY_STEP_INDEX);
      return;
    }
    goTo(stepIndex + 1);
  };

  const goBack = () => {
    setReturnToSummary(false);
    goTo(stepIndex - 1);
  };

  const skip = () => {
    update(step.skip.clear);
    goTo(returnToSummary ? SUMMARY_STEP_INDEX : stepIndex + 1);
    setReturnToSummary(false);
  };

  // Из итогового экрана: открыть нужный шаг, а после него вернуться к итогам
  const editStep = (stepId) => {
    setReturnToSummary(true);
    goTo(STEPS.findIndex((s) => s.id === stepId));
  };

  const finish = async () => {
    // Последняя проверка всех данных — на случай, если что-то пропущено
    const errors = validateDraft(draft);
    const firstInvalidStep = STEPS.findIndex((s) => s.fields.some((field) => errors[field]));
    if (firstInvalidStep !== -1) {
      setReturnToSummary(true);
      goTo(firstInvalidStep);
      setShowErrors(true);
      return;
    }

    setSaving(true);
    setSaveError(false);
    try {
      await saveNewProfile(buildProfileFromDraft(draft));
      // Профиль появился — навигация сама переключится на Главную
    } catch (error) {
      logError('Не удалось сохранить профиль', error);
      setSaveError(true);
      setSaving(false);
    }
  };

  const isSummary = step.id === 'summary';
  const progressIndex = PROGRESS_STEPS.indexOf(step);

  const primaryLabel = step.id === 'welcome' ? t('onboarding.welcome.start') : isSummary ? t('onboarding.summary.finish') : t('common.next');

  const StepComponent = step.Component;

  return (
    <OnboardingLayout
      stepId={step.id}
      direction={direction}
      scroll={step.scroll !== false}
      onBack={stepIndex > 0 ? goBack : undefined}
      progress={progressIndex >= 0 ? (progressIndex + 1) / PROGRESS_STEPS.length : null}
      progressLabel={progressIndex >= 0 ? t('onboarding.step', { current: progressIndex + 1, total: PROGRESS_STEPS.length }) : null}
      primaryLabel={saving ? t('onboarding.summary.saving') : primaryLabel}
      primaryIcon={isSummary ? 'checkmark' : 'arrow-forward'}
      onPrimary={isSummary ? finish : goNext}
      primaryDisabled={saving}
      skipLabel={step.skip ? t(step.skip.labelKey) : null}
      onSkip={step.skip ? skip : undefined}
      footer={step.Footer ? <step.Footer draft={draft} /> : null}
    >
      <StepComponent
        draft={draft}
        update={update}
        errors={showErrors ? stepErrors : {}}
        onSubmit={goNext}
        onEdit={editStep}
        saveError={saveError}
      />
    </OnboardingLayout>
  );
}
