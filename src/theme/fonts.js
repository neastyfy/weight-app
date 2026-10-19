// Шрифты приложения.
// Nunito из Google Fonts — самый близкий к SF Pro Rounded округлый шрифт,
// в котором есть буквы всех 7 языков приложения (латиница и кириллица, включая казахскую).
// Каждое начертание импортируется отдельно, чтобы в сборку попали только нужные файлы.
import { Nunito_400Regular } from '@expo-google-fonts/nunito/400Regular';
import { Nunito_600SemiBold } from '@expo-google-fonts/nunito/600SemiBold';
import { Nunito_700Bold } from '@expo-google-fonts/nunito/700Bold';
import { Nunito_800ExtraBold } from '@expo-google-fonts/nunito/800ExtraBold';

// Файлы шрифтов, которые загружаются при старте приложения (см. App.js).
export const fontFiles = {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
};

// Имена начертаний для использования в стилях: style={{ fontFamily: fonts.bold }}
export const fonts = {
  regular: 'Nunito_400Regular', // основной текст, подписи
  semiBold: 'Nunito_600SemiBold', // заголовки разделов
  bold: 'Nunito_700Bold', // крупные заголовки
  extraBold: 'Nunito_800ExtraBold', // крупные числа (например, вес)
};
