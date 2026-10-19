// Основа любого экрана: фон, безопасные зоны (вырез, «чёлка», панель Home), прокрутка
// и мягкое пружинное появление содержимого при открытии.
// Пример:
//   <Screen>
//     <ScreenHeader title="Графики" />
//     <Card>…</Card>
//   </Screen>
// withTabBar — экран находится во вкладке: снизу отступ уже даёт панель вкладок.
// pushed — вложенный экран (открыт поверх вкладок): в браузере въезжает справа, см. PageTransition.
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/theme';

import { Appear } from './Appear';
import { PageTransition } from './PageTransition';

export function Screen({ children, scroll = true, withTabBar = false, pushed = false, contentStyle }) {
  const { colors, spacing, layout } = useTheme();
  const insets = useSafeAreaInsets();

  const padding = {
    paddingTop: insets.top + spacing.md,
    paddingBottom: (withTabBar ? 0 : insets.bottom) + spacing.xxl,
    paddingHorizontal: layout.screenPadding,
    gap: spacing.lg,
  };

  const content = <Appear style={[{ gap: spacing.lg }, !scroll && { flex: 1 }]}>{children}</Appear>;

  let screen;
  if (!scroll) {
    screen = <View style={[{ flex: 1, backgroundColor: colors.background }, padding, contentStyle]}>{content}</View>;
  } else {
    screen = (
      <ScrollView
        style={{ flex: 1, backgroundColor: colors.background }}
        contentContainerStyle={[padding, contentStyle]}
        keyboardShouldPersistTaps="handled"
      >
        {content}
      </ScrollView>
    );
  }

  return pushed ? <PageTransition style={{ backgroundColor: colors.background }}>{screen}</PageTransition> : screen;
}
