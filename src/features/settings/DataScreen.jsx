// Данные: резервная копия (JSON), таблицы (CSV), восстановление и полное удаление.
//
// Восстановление в три шага:
//   1) выбор файла и строгая проверка (parseBackup) — база не меняется;
//   2) экран «что будет восстановлено» с предупреждением о замене всех данных;
//   3) после явного подтверждения — полная замена одной транзакцией (useProfile().restoreBackup).
// Отмена на любом шаге ничего не меняет.
import { useSQLiteContext } from '@/storage/sqlite';
import { useState } from 'react';
import { View } from 'react-native';

import { AppText, Button, Card, ConfirmDialog, Screen, ScreenHeader, SectionHeader } from '@/components';
import { createBackup, parseBackup } from '@/features/backup/backupFormat';
import { pickTextFile, saveTextFile } from '@/features/backup/backupFiles';
import { readBackupData } from '@/features/backup/backupRepository';
import { bodyMeasurementsToCsv, weightEntriesToCsv } from '@/features/backup/csvExport';
import { useProfile } from '@/features/profile';
import { useTranslation } from '@/i18n';
import { dayKey } from '@/lib/dates';
import { formatDateTime, formatShortDate } from '@/lib/format';
import { useTheme } from '@/theme';
import { logError } from '@/lib/logError';

export function DataScreen() {
  const db = useSQLiteContext();
  const { t, language } = useTranslation();
  const { colors, spacing } = useTheme();
  const { profile, restoreBackup, resetAllData } = useProfile();

  const [busy, setBusy] = useState(null); // какое действие выполняется
  const [message, setMessage] = useState(null); // { tone: 'success' | 'error', text }
  const [pending, setPending] = useState(null); // проверенная копия, ждущая подтверждения
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const today = dayKey(new Date());

  // Выполнить действие с индикатором и понятным сообщением об ошибке.
  // В лог пишется только техническая ошибка, без данных пользователя.
  const run = async (name, action) => {
    setBusy(name);
    setMessage(null);
    try {
      await action();
    } catch (error) {
      logError(`Действие с данными не выполнено: ${name}`, error);
      setMessage({ tone: 'error', text: t('data.failed') });
    } finally {
      setBusy(null);
    }
  };

  const exportJson = () =>
    run('json', async () => {
      const backup = createBackup(await readBackupData(db));
      await saveTextFile({ fileName: `weightapp-backup-${today}.json`, mimeType: 'application/json', text: JSON.stringify(backup, null, 2) });
      setMessage({ tone: 'success', text: t('data.exported') });
    });

  const csvLabels = {
    date: t('data.csv.date'),
    time: t('data.csv.time'),
    weightKg: `${t('data.csv.weight')}, ${t('units.kg')}`,
    weightInUnit: `${t('data.csv.weight')}, ${t(`units.${profile.weightUnit}`)}`,
    note: t('entries.noteLabel'),
    measuredAtUtc: t('data.csv.utc'),
    type: t('data.csv.typeCode'),
    typeName: t('data.csv.type'),
    valueCm: `${t('data.csv.value')}, ${t('units.cm')}`,
    valueInUnit: `${t('data.csv.value')}, ${t(`units.${profile.heightUnit}`)}`,
  };

  const exportCsv = (kind) =>
    run(kind, async () => {
      const data = await readBackupData(db);
      const text =
        kind === 'weightCsv'
          ? weightEntriesToCsv(data.weightEntries, { unit: profile.weightUnit, labels: csvLabels })
          : bodyMeasurementsToCsv(data.bodyMeasurements, { unit: profile.heightUnit, labels: csvLabels, typeName: (id) => t(`body.types.${id}`) });
      const name = kind === 'weightCsv' ? 'weight' : 'body';
      await saveTextFile({ fileName: `weightapp-${name}-${today}.csv`, mimeType: 'text/csv', text });
      setMessage({ tone: 'success', text: t('data.exported') });
    });

  const chooseBackup = () =>
    run('pick', async () => {
      setPending(null);
      const file = await pickTextFile();
      if (!file) return; // выбор отменён
      const result = file.tooLarge ? { ok: false, error: 'tooLarge' } : parseBackup(file.text);
      if (!result.ok) {
        setMessage({ tone: 'error', text: t(`data.importErrors.${result.error}`) });
        return;
      }
      setPending(result);
    });

  const restore = () =>
    run('restore', async () => {
      setConfirmRestore(false);
      await restoreBackup(pending.data);
      setPending(null);
      setMessage({ tone: 'success', text: t('data.restored') });
    });

  const deleteEverything = async () => {
    setBusy('delete');
    try {
      await resetAllData(); // после удаления приложение само покажет онбординг
    } catch (error) {
      logError('Не удалось удалить данные', error);
      setConfirmDelete(false);
      setBusy(null);
      setMessage({ tone: 'error', text: t('data.failed') });
    }
  };

  const summary = pending?.summary;

  return (
    <Screen pushed>
      <ScreenHeader title={t('data.title')} showBack />

      {message ? (
        <Card style={{ backgroundColor: message.tone === 'error' ? colors.errorSoft : colors.successSoft }}>
          <AppText color={message.tone === 'error' ? 'errorText' : 'successText'}>{message.text}</AppText>
        </Card>
      ) : null}

      {/* Подтверждение восстановления: что именно будет восстановлено */}
      {summary ? (
        <Card style={{ gap: spacing.sm, borderWidth: 2, borderColor: colors.warning }}>
          <AppText variant="subheading">{t('data.preview.title')}</AppText>
          <View style={{ gap: spacing.xxs }}>
            <PreviewRow label={t('data.preview.profile')} value={summary.nickname} />
            {summary.exportedAt ? <PreviewRow label={t('data.preview.exportedAt')} value={formatDateTime(summary.exportedAt, language)} /> : null}
            <PreviewRow label={t('data.preview.weights')} value={String(summary.weightCount)} />
            <PreviewRow label={t('data.preview.body')} value={String(summary.bodyCount)} />
            <PreviewRow label={t('data.preview.goals')} value={String(summary.goalCount)} />
            {summary.firstDate ? (
              <PreviewRow
                label={t('data.preview.period')}
                value={`${formatShortDate(summary.firstDate, language)} – ${formatShortDate(summary.lastDate, language)}`}
              />
            ) : null}
          </View>
          {pending.warnings.length ? (
            <AppText variant="small" color="textSecondary">
              {[...new Set(pending.warnings.map((warning) => t(`data.warnings.${warning.code}`)))].join(' ')}
            </AppText>
          ) : null}
          <AppText variant="caption" color="warningText">
            {t('data.preview.replaceWarning')}
          </AppText>
          <Button title={t('data.preview.restore')} icon="cloud-download-outline" onPress={() => setConfirmRestore(true)} disabled={busy != null} />
          <Button title={t('common.cancel')} variant="text" onPress={() => setPending(null)} disabled={busy != null} />
        </Card>
      ) : null}

      <View style={{ gap: spacing.sm }}>
        <SectionHeader title={t('data.backupTitle')} />
        <Card style={{ gap: spacing.sm }}>
          <AppText variant="caption" color="textSecondary">
            {t('data.backupText')}
          </AppText>
          <Button title={busy === 'json' ? t('data.working') : t('data.exportJson')} icon="share-outline" onPress={exportJson} disabled={busy != null} />
          <Button
            title={busy === 'pick' || busy === 'restore' ? t('data.working') : t('data.importJson')}
            variant="secondary"
            icon="folder-open-outline"
            onPress={chooseBackup}
            disabled={busy != null}
          />
        </Card>
      </View>

      <View style={{ gap: spacing.sm }}>
        <SectionHeader title={t('data.csvTitle')} />
        <Card style={{ gap: spacing.sm }}>
          <AppText variant="caption" color="textSecondary">
            {t('data.csvText')}
          </AppText>
          <Button title={t('data.exportWeightCsv')} variant="secondary" icon="document-text-outline" onPress={() => exportCsv('weightCsv')} disabled={busy != null} />
          <Button title={t('data.exportBodyCsv')} variant="secondary" icon="document-text-outline" onPress={() => exportCsv('bodyCsv')} disabled={busy != null} />
        </Card>
      </View>

      <View style={{ gap: spacing.sm }}>
        <SectionHeader title={t('data.deleteTitle')} />
        <Card style={{ gap: spacing.sm }}>
          <AppText variant="caption" color="textSecondary">
            {t('data.deleteText')}
          </AppText>
          <Button title={t('data.deleteButton')} variant="secondary" icon="trash-outline" textColor={colors.errorText} onPress={() => setConfirmDelete(true)} disabled={busy != null} />
        </Card>
      </View>

      <ConfirmDialog
        visible={confirmRestore}
        title={t('data.confirmRestore.title')}
        message={t('data.confirmRestore.text')}
        confirmLabel={t('data.confirmRestore.confirm')}
        destructive
        busy={busy === 'restore'}
        onConfirm={restore}
        onCancel={() => setConfirmRestore(false)}
      />
      <ConfirmDialog
        visible={confirmDelete}
        title={t('data.confirmDelete.title')}
        message={t('data.confirmDelete.text')}
        confirmLabel={t('data.confirmDelete.confirm')}
        destructive
        busy={busy === 'delete'}
        onConfirm={deleteEverything}
        onCancel={() => setConfirmDelete(false)}
      />
    </Screen>
  );
}

function PreviewRow({ label, value }) {
  const { spacing } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm }}>
      <AppText variant="caption" color="textSecondary">
        {label}
      </AppText>
      <AppText variant="caption" style={{ flexShrink: 1 }} align="right">
        {value}
      </AppText>
    </View>
  );
}
