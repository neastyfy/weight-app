// Форма измерения окружности: добавление (type, без entryId) или редактирование (entryId).
// Значение выбирается линейкой в единицах роста пользователя (см или дюймы), хранится в сантиметрах.
import { router } from 'expo-router';
import { useState } from 'react';

import { AppText, Card, ValuePicker } from '@/components';
import { useProfile } from '@/features/profile';
import { useTranslation } from '@/i18n';
import { fromCm, roundTo, toCm } from '@/lib/units';
import { useTheme } from '@/theme';

import { EntryEditorLayout } from './EntryEditorLayout';
import { EntryNotFound } from './EntryNotFound';
import { useMeasurements } from './MeasurementsProvider';
import { getBodyMeasurementType } from './measurementModel';
import { useEntryEditor } from './useEntryEditor';

// Настройки линейки окружностей в каждой единице
const STEPS = {
  cm: { step: 0.5, majorEvery: 2, labelEvery: 10 },
  in: { step: 0.1, majorEvery: 5, labelEvery: 10 },
};

export function BodyMeasurementForm({ type, entryId }) {
  const { bodyMeasurements, status } = useMeasurements();
  const entry = entryId != null ? bodyMeasurements.find((m) => m.id === entryId) : null;
  const typeId = entry?.type ?? type;
  const config = getBodyMeasurementType(typeId);

  if ((entryId != null && !entry) || !config) {
    return status === 'loading' ? null : <EntryNotFound />;
  }
  // Начальное положение: прошлое значение этой окружности или типичное
  const previous = bodyMeasurements.find((m) => m.type === typeId);
  return <BodyMeasurementEditor entry={entry} config={config} startCm={entry?.valueCm ?? previous?.valueCm ?? config.initialCm} />;
}

function BodyMeasurementEditor({ entry, config, startCm }) {
  const { t } = useTranslation();
  const { spacing } = useTheme();
  const { profile } = useProfile();
  const { addBodyMeasurement, updateBodyMeasurement, deleteBodyMeasurement } = useMeasurements();
  const unit = profile.heightUnit;
  const picker = {
    ...STEPS[unit],
    min: roundTo(fromCm(config.minCm, unit), 1),
    max: roundTo(fromCm(config.maxCm, unit), 1),
  };

  const [valueCm, setValueCm] = useState(startCm);
  const [measuredAt, setMeasuredAt] = useState(() => (entry ? new Date(entry.measuredAt) : new Date()));
  const [note, setNote] = useState(entry?.note ?? '');

  const goBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace(`/body/${config.id}`);
  };

  const editor = useEntryEditor({
    save: ({ allowDuplicate }) => {
      const data = { type: config.id, valueCm, measuredAt, note };
      return entry
        ? updateBodyMeasurement(entry.id, data, { allowDuplicate })
        : addBodyMeasurement(data, { allowDuplicate });
    },
    remove: () => deleteBodyMeasurement(entry.id),
    onDone: goBack,
  });

  const displayValue = roundTo(fromCm(valueCm, unit), 1);
  const name = t(`body.types.${config.id}`);

  return (
    <EntryEditorLayout
      title={entry ? t('body.editTitle', { name }) : t('body.addTitle', { name })}
      measuredAt={measuredAt}
      onMeasuredAtChange={setMeasuredAt}
      note={note}
      onNoteChange={setNote}
      editor={editor}
      canDelete={Boolean(entry)}
    >
      <Card style={{ paddingVertical: 24, gap: spacing.md }}>
        <AppText variant="caption" color="textSecondary" align="center">
          {t(`body.hints.${config.id}`)}
        </AppText>
        <ValuePicker
          value={displayValue}
          onChange={(value) => {
            if (value !== displayValue) setValueCm(toCm(value, unit));
            editor.clearFieldError('valueCm');
          }}
          {...picker}
          initialValue={displayValue}
          unit={t(`units.${unit}`)}
          fadeColor="surface"
          error={editor.errors.valueCm ? t(editor.errors.valueCm.key, { min: picker.min, max: picker.max, unit: t(`units.${unit}`) }) : null}
        />
      </Card>
    </EntryEditorLayout>
  );
}
