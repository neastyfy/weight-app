// Нативное расширение iOS: виджет главного экрана (SwiftUI + WidgetKit).
// Подключается плагином @bacons/apple-targets при `npx expo prebuild` (см. docs/IOS_BUILD.md).
// Все файлы этой папки становятся частью Xcode-таргета виджета.
//
// Данные виджет получает от приложения через общее хранилище App Group — ту же группу,
// что указана в app.json (ios.entitlements). Сам виджет базу приложения не открывает.

/** @type {import('@bacons/apple-targets/app.plugin').ConfigFunction} */
module.exports = (config) => ({
  type: 'widget',
  name: 'WeightWidget',
  displayName: 'WeightApp',
  bundleIdentifier: '.widget',
  // containerBackground и современный API WidgetKit — с iOS 17
  deploymentTarget: '17.0',
  entitlements: {
    'com.apple.security.application-groups': config.ios.entitlements['com.apple.security.application-groups'],
  },
  // Цвета как в приложении (src/theme/colors.js): светлый и тёмный вариант
  colors: {
    $widgetBackground: { color: '#FCFAF8', darkColor: '#101A30' },
    // тот же цвет под обычным именем — для Color("WidgetBackground") в Swift
    WidgetBackground: { color: '#FCFAF8', darkColor: '#101A30' },
    $accent: { color: '#6485F2', darkColor: '#7391F6' },
    TextPrimary: { color: '#1C2340', darkColor: '#F2F4FA' },
    TextSecondary: { color: '#6E7489', darkColor: '#A2AAC2' },
    Track: { color: '#F3EFEB', darkColor: '#232F4D' },
    Success: { color: '#1E9E74', darkColor: '#5ED8AF' },
    Caution: { color: '#9A6B0E', darkColor: '#F5CB6E' },
    Error: { color: '#D04745', darkColor: '#F28F8D' },
    GradientStart: { color: '#3CC596', darkColor: '#3CC596' },
    GradientEnd: { color: '#8FD6F5', darkColor: '#7BC6EC' },
  },
});
