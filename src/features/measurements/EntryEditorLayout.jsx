// Общий макет формы записи (вес или окружность):
//   заголовок → [значение — children] → дата и время → комментарий → ошибки → кнопки,
//   а также диалоги «похоже на повтор» и «удалить запись?».
import { View } from 'react-native';

import { AppText, Button, Card, ConfirmDialog, DateTimeField, Screen, ScreenHeader, TextField } from '@/components';
import { useTranslation } from '@/i18n';
import { formatDateTime } from '@/lib/format';
import { useTheme } from '@/theme';

import { NOTE_MAX_LENGTH } from './measurementModel';

export function EntryEditorLayout({
  title,
  children,
  measuredAt,
  onMeasuredAtChange,
  note,
  onNoteChange,
  editor,
  canDelete = false,
}) {
  const { t, translateError, language } = useTranslation();
  const { colors, spacing } = useTheme();

  return (
    <Screen pushed>
      <ScreenHeader title={title} showBack />

      {children}

      <Card style={{ gap: spacing.md }}>
        <DateTimeField
          label={t('entries.dateLabel')}
          value={measuredAt}
          onChange={(date) => {
            editor.clearFieldError('measuredAt');
            onMeasuredAtChange(date);
          }}
          error={translateError(editor.errors.measuredAt)}
        />
        <TextField
          label={t('entries.noteLabel')}
          placeholder={t('entries.notePlaceholder')}
          value={note}
          onChangeText={onNoteChange}
          maxLength={NOTE_MAX_LENGTH}
          error={translateError(editor.errors.note)}
          returnKeyType="done"
        />
      </Card>

      {editor.failure ? (
        <Card style={{ backgroundColor: colors.errorSoft }}>
          <AppText color="errorText">{t(`entries.failure.${editor.failure}`)}</AppText>
        </Card>
      ) : null}

      <View style={{ gap: spacing.xxs }}>
        <Button
          title={editor.saving ? t('common.saving') : t('common.save')}
          icon="checkmark"
          onPress={() => editor.submit()}
          disabled={editor.saving}
        />
        {canDelete ? (
          <Button title={t('common.delete')} variant="text" textColor={colors.errorText} onPress={editor.requestDelete} />
        ) : null}
      </View>

      <ConfirmDialog
        visible={Boolean(editor.duplicate)}
        title={t('entries.duplicateTitle')}
        message={
          editor.duplicate ? t('entries.duplicateText', { date: formatDateTime(editor.duplicate.measuredAt, language) }) : null
        }
        confirmLabel={t('entries.saveAnyway')}
        busy={editor.saving}
        onConfirm={editor.saveAnyway}
        onCancel={editor.dismissDuplicate}
      />
      <ConfirmDialog
        visible={editor.askDelete}
        title={t('entries.deleteTitle')}
        message={t('entries.deleteText', { date: formatDateTime(measuredAt.toISOString(), language) })}
        confirmLabel={t('common.delete')}
        destructive
        busy={editor.saving}
        onConfirm={editor.confirmDelete}
        onCancel={editor.cancelDelete}
      />
    </Screen>
  );
}
