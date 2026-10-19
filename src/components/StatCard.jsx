// Небольшая карточка показателя: подпись, крупное значение и пояснение под ним.
// Пример: <StatCard label="ИМТ" value="23,6" caption="В пределах нормы" captionColor="successText" />
// children — дополнительное содержимое внизу (например, цветная шкала)
import { View } from 'react-native';

import { useTheme } from '@/theme';

import { AppText } from './AppText';
import { Card } from './Card';
import { IconBadge } from './IconBadge';

export function StatCard({ label, value, unit, caption, captionColor = 'textSecondary', icon, iconTone, style, children }) {
  const { spacing } = useTheme();

  return (
    <Card style={[{ gap: spacing.xxs, padding: spacing.md }, style]}>
      {icon ? <IconBadge icon={icon} tone={iconTone} size={32} /> : null}
      <AppText variant="small" color="textSecondary">
        {label}
      </AppText>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: spacing.xxs, flexWrap: 'wrap' }}>
        <AppText variant="heading">{value}</AppText>
        {unit ? (
          <AppText variant="caption" color="textSecondary">
            {unit}
          </AppText>
        ) : null}
      </View>
      {caption ? (
        <AppText variant="caption" color={captionColor}>
          {caption}
        </AppText>
      ) : null}
      {children}
    </Card>
  );
}
