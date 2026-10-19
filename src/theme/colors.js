// Цвета приложения.
// Исходная палитра взята из мудборда (assets/references/moodboard.png).
// В компонентах цвета берутся только из темы: const { colors } = useTheme();
// Так светлая и тёмная темы переключаются автоматически.

// Базовая палитра мудборда — используется только в этом файле.
const palette = {
  ivory: '#FCFAF8', // тёплый почти белый — фон приложения (светлее прежнего #F8F5F2, но не чисто белый)
  white: '#FFFFFF', // облачный белый — карточки
  sky: '#D9F0FA', // нежно-голубой
  blue: '#6485F2', // васильковый — основной цвет
  mint: '#4BCFA4', // мятный — успех
  pink: '#F7C6D5', // розовый — забота
  navy: '#101A30', // тёмно-синий — фон тёмной темы
};

export const lightColors = {
  // Фоны и поверхности
  background: palette.ivory,
  surface: palette.white,
  surfaceMuted: '#F3EFEB', // поля, переключатели, неактивные элементы
  surfaceRaised: palette.white, // выбранный вариант в переключателе
  border: '#ECE6E0',
  tabBar: palette.white,
  overlay: 'rgba(16, 26, 48, 0.4)',

  // Текст
  text: '#1C2340',
  textSecondary: '#6E7489',
  textTertiary: '#A3A8B7',
  textOnPrimary: palette.white,

  // Основной цвет (кнопки, активная вкладка, выбор)
  primary: palette.blue,
  primaryPressed: '#4F6FE0',
  primaryGradient: ['#7C9BF8', '#5B7BEE'],
  primarySoft: '#E8EDFD', // вторичная кнопка, выбранная строка
  focusRing: 'rgba(100, 133, 242, 0.35)',

  // Акценты
  sky: palette.sky,
  success: palette.mint,
  successText: '#1E9E74', // мятный для текста — темнее, чтобы читался на белом
  successSoft: '#E1F7EF',
  successGradient: ['#3CC596', '#8FD6F5'], // полосы прогресса: от зелёного к светлому голубоватому
  pink: palette.pink,
  pinkSoft: '#FDEDF2',
  pinkText: '#D9578A', // розовый для иконок и текста — насыщеннее, чтобы был виден
  warning: '#F5A25D',
  warningSoft: '#FEF1E4',
  warningText: '#C2601A', // оранжевый для текста — темнее, чтобы читался на белом
  caution: '#F2B544', // жёлтый — «неплохо, но есть куда расти»
  cautionSoft: '#FDF4DD',
  cautionText: '#9A6B0E',
  purple: '#9B8AFB',
  purpleSoft: '#EFECFE',

  // Ошибки
  error: '#E5615F',
  errorSoft: '#FDECEC',
  errorText: '#D04745',

  // Отключённые элементы
  disabled: '#E9E5E1',
  disabledText: '#B2B4BE',

  // Нижняя панель вкладок
  tabInactive: '#9CA1B1',

  // Тени
  shadow: 'rgba(28, 35, 64, 0.08)',
};

export const darkColors = {
  background: palette.navy,
  surface: '#1A2540',
  surfaceMuted: '#232F4D',
  surfaceRaised: '#33416A',
  border: '#2B3757',
  tabBar: '#16203A',
  overlay: 'rgba(0, 0, 0, 0.55)',

  text: '#F2F4FA',
  textSecondary: '#A2AAC2',
  textTertiary: '#6E7896',
  textOnPrimary: palette.white,

  primary: '#7391F6',
  primaryPressed: '#5F7FEA',
  primaryGradient: ['#86A3FA', '#6283F0'],
  primarySoft: '#26345C',
  focusRing: 'rgba(115, 145, 246, 0.45)',

  sky: '#1F3550',
  success: palette.mint,
  successText: '#5ED8AF',
  successSoft: '#183B3A',
  successGradient: ['#3CC596', '#7BC6EC'],
  pink: palette.pink,
  pinkSoft: '#3A2A3E',
  pinkText: '#F49AC1',
  warning: '#F5A25D',
  warningSoft: '#3B2E2A',
  warningText: '#F7B47A',
  caution: '#F2B544',
  cautionSoft: '#3A3324',
  cautionText: '#F5CB6E',
  purple: '#A898FC',
  purpleSoft: '#2C2A52',

  error: '#F07A78',
  errorSoft: '#3D2330',
  errorText: '#F28F8D',

  disabled: '#26314E',
  disabledText: '#5F6A88',

  tabInactive: '#6E7896',

  shadow: 'rgba(0, 0, 0, 0.35)',
};
