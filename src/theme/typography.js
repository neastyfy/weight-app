// Типографика: стили текста по ролям (из мудборда).
// Использование: <AppText variant="heading">…</AppText>
import { fonts } from './fonts';

export const typography = {
  // Крупный заголовок экрана — H1 34/40
  largeTitle: { fontFamily: fonts.bold, fontSize: 34, lineHeight: 40 },
  // Заголовок экрана с кнопкой «назад» и шагов онбординга
  title: { fontFamily: fonts.bold, fontSize: 26, lineHeight: 32 },
  // Заголовок раздела — H2 22/28
  heading: { fontFamily: fonts.bold, fontSize: 22, lineHeight: 28 },
  // Подзаголовок, заголовок карточки, текст кнопки
  subheading: { fontFamily: fonts.semiBold, fontSize: 17, lineHeight: 24 },
  // Основной текст — Body 17/24
  body: { fontFamily: fonts.regular, fontSize: 17, lineHeight: 24 },
  // Второстепенный текст, подсказки — Caption 15/20
  caption: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 20 },
  // Мелкие подписи: вкладки, метки над полями
  small: { fontFamily: fonts.semiBold, fontSize: 13, lineHeight: 18 },
  // Крупные числа (например, вес)
  number: { fontFamily: fonts.extraBold, fontSize: 34, lineHeight: 40 },
};
