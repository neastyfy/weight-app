// Нижняя панель вкладок (как в референсе: 5 разделов, «+» по центру).
import Ionicons from '@expo/vector-icons/Ionicons';
import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTranslation } from '@/i18n';
import { fonts, useTheme } from '@/theme';
import { springs } from '@/theme/motion';

// Вкладки по порядку. name — имя файла экрана в этой папке.
// isMainAction — круглая «+» по центру: не открывает вкладку, а открывает форму новой записи веса.
// icon — иконка Ionicons (https://icons.expo.fyi): активная вкладка — заливка, неактивная — контур.
const TABS = [
  { name: 'index', titleKey: 'tabs.home', icon: 'home' },
  { name: 'charts', titleKey: 'tabs.charts', icon: 'stats-chart' },
  { name: 'add', titleKey: 'tabs.add', icon: 'add', isMainAction: true },
  { name: 'goal', titleKey: 'tabs.goal', icon: 'flag' },
  { name: 'more', titleKey: 'tabs.more', icon: 'ellipsis-horizontal' },
];

// Высота панели без учёта нижней безопасной зоны (полоски Home на iPhone)
const TAB_BAR_HEIGHT = 70;

export default function TabsLayout() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          height: TAB_BAR_HEIGHT + insets.bottom,
          paddingTop: 6,
          paddingBottom: insets.bottom + 8,
        },
        // Высота строки с запасом: у Nunito длинные «хвосты» букв (g, у, ф)
        tabBarLabelStyle: { fontFamily: fonts.semiBold, fontSize: 11, lineHeight: 18, height: 18, flexShrink: 0 },
        sceneStyle: { backgroundColor: colors.background },
        // Мягкий сдвиг содержимого при переключении вкладок
        animation: 'shift',
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          listeners={
            tab.isMainAction
              ? {
                  tabPress: (event) => {
                    event.preventDefault();
                    router.push('/weight/new');
                  },
                }
              : undefined
          }
          options={{
            title: t(tab.titleKey),
            tabBarIcon: ({ color, focused }) => (
              <BouncyIcon focused={focused}>
                {tab.isMainAction ? (
                  <MainActionIcon icon={tab.icon} color={color} />
                ) : (
                  <Ionicons name={focused ? tab.icon : `${tab.icon}-outline`} size={24} color={color} />
                )}
              </BouncyIcon>
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

// Иконка выбранной вкладки слегка «подпрыгивает»
function BouncyIcon({ focused, children }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    if (focused) {
      scale.value = withSequence(withSpring(1.18, springs.press), withSpring(1, springs.pop));
    }
  }, [focused, scale]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <Animated.View style={style}>{children}</Animated.View>;
}

// Круглая кнопка «+» в центре панели
function MainActionIcon({ icon, color }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={22} color={colors.textOnPrimary} />
    </View>
  );
}
