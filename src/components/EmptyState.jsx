// Пустое состояние списка: маскот, заголовок, пояснение и кнопка действия.
// Пример: <EmptyState title="Записей пока нет" text="…" actionLabel="Добавить" onAction={…} />
import { View } from 'react-native';

import { Mascot } from '@/features/mascots/Mascot';
import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { Button } from './Button';
import { Card } from './Card';

export function EmptyState({ title, text, actionLabel, onAction, mascotId }) {
  const { spacing } = useTheme();
  return (
    <Card style={{ alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl }}>
      <View style={{ padding: spacing.sm }}>
        <Mascot mascotId={mascotId} state="sleep" size={120} />
      </View>
      <AppText variant="heading" align="center">
        {title}
      </AppText>
      {text ? (
        <AppText color="textSecondary" align="center">
          {text}
        </AppText>
      ) : null}
      {actionLabel ? <Button title={actionLabel} icon="add" onPress={onAction} style={{ alignSelf: 'stretch', marginTop: spacing.xs }} /> : null}
    </Card>
  );
}
