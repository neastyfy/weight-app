// Подтверждение действия (удаление, сохранение похожей записи).
// В браузере системный Alert не работает, поэтому используем свою панель.
// Пример:
//   <ConfirmDialog
//     visible={asking}
//     title="Удалить запись?"
//     message="Запись будет удалена без возможности восстановления."
//     confirmLabel="Удалить"
//     destructive
//     onConfirm={remove}
//     onCancel={() => setAsking(false)}
//   />
import { View } from 'react-native';

import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';
import { Sheet } from './Sheet';

export function ConfirmDialog({ visible, title, message, confirmLabel, destructive = false, busy = false, onConfirm, onCancel }) {
  const { t } = useTranslation();
  const { colors, spacing } = useTheme();

  return (
    <Sheet visible={visible} onClose={onCancel} title={title}>
      {message ? (
        <AppText color="textSecondary" align="center">
          {message}
        </AppText>
      ) : null}
      <View style={{ gap: spacing.xxs }}>
        <Button
          title={confirmLabel}
          onPress={onConfirm}
          disabled={busy}
          variant={destructive ? 'secondary' : 'primary'}
          style={destructive ? { backgroundColor: colors.errorSoft } : null}
          textColor={destructive ? colors.errorText : undefined}
        />
        <Button title={t('common.cancel')} variant="text" onPress={onCancel} />
      </View>
    </Sheet>
  );
}
