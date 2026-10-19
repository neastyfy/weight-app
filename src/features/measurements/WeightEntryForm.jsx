// Форма записи веса: добавление (без entryId) или редактирование (с entryId).
// Вес выбирается линейкой в единицах пользователя, хранится в килограммах.
// Если значение не трогали, сохраняется исходное — без лишнего округления.
import { router } from 'expo-router';
import { useState } from 'react';

import { Card, ValuePicker } from '@/components';
import { PICKERS, useProfile } from '@/features/profile';
import { useTranslation } from '@/i18n';
import { fromKg, roundTo, toKg } from '@/lib/units';

import { EntryEditorLayout } from './EntryEditorLayout';
import { EntryNotFound } from './EntryNotFound';
import { useMeasurements } from './MeasurementsProvider';
import { useEntryEditor } from './useEntryEditor';

const DEFAULT_WEIGHT_KG = 70; // начальное положение шкалы, если записей ещё нет

function goBack() {
  if (router.canGoBack()) router.back();
  else router.replace('/weight');
}

// После добавления — в историю веса, чтобы сразу видеть новую запись в списке.
// dismissTo вернётся к уже открытой истории, а если её нет — откроет её вместо формы.
function goToHistory() {
  router.dismissTo('/weight');
}

export function WeightEntryForm({ entryId }) {
  const { weightEntries, latestWeight, status } = useMeasurements();
  const entry = entryId != null ? weightEntries.find((e) => e.id === entryId) : null;

  if (entryId != null && !entry) {
    return status === 'loading' ? null : <EntryNotFound />;
  }
  return <WeightEntryEditor entry={entry} startKg={entry?.weightKg ?? latestWeight?.weightKg ?? DEFAULT_WEIGHT_KG} />;
}

function WeightEntryEditor({ entry, startKg }) {
  const { t } = useTranslation();
  const { profile } = useProfile();
  const { addWeight, updateWeight, deleteWeight } = useMeasurements();
  const unit = profile.weightUnit;
  const picker = PICKERS.weight[unit];

  const [weightKg, setWeightKg] = useState(startKg);
  const [measuredAt, setMeasuredAt] = useState(() => (entry ? new Date(entry.measuredAt) : new Date()));
  const [note, setNote] = useState(entry?.note ?? '');

  const editor = useEntryEditor({
    save: ({ allowDuplicate }) => {
      const data = { weightKg, measuredAt, note };
      return entry ? updateWeight(entry.id, data, { allowDuplicate }) : addWeight(data, { allowDuplicate });
    },
    remove: () => deleteWeight(entry.id),
    // правка и удаление возвращают туда, откуда открыли запись; новая запись — в историю
    onDone: entry ? goBack : goToHistory,
  });

  const displayValue = roundTo(fromKg(weightKg, unit), 1);

  return (
    <EntryEditorLayout
      title={entry ? t('weight.editTitle') : t('weight.addTitle')}
      measuredAt={measuredAt}
      onMeasuredAtChange={setMeasuredAt}
      note={note}
      onNoteChange={setNote}
      editor={editor}
      canDelete={Boolean(entry)}
    >
      <Card style={{ paddingVertical: 24 }}>
        <ValuePicker
          value={displayValue}
          onChange={(value) => {
            // меняем килограммы только если пользователь действительно выбрал другое значение
            if (value !== displayValue) setWeightKg(toKg(value, unit));
            editor.clearFieldError('weightKg');
          }}
          {...picker}
          initialValue={displayValue}
          unit={t(`units.${unit}`)}
          fadeColor="surface"
          error={editor.errors.weightKg ? t(editor.errors.weightKg.key, { min: picker.min, max: picker.max, unit: t(`units.${unit}`) }) : null}
        />
      </Card>
    </EntryEditorLayout>
  );
}
