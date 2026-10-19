// Поддерживаемые языки приложения.
import cs from './translations/cs';
import de from './translations/de';
import en from './translations/en';
import kk from './translations/kk';
import pl from './translations/pl';
import ru from './translations/ru';
import uk from './translations/uk';

// Порядок списка = порядок на экране выбора языка.
export const LANGUAGES = [
  { code: 'en', nativeName: 'English' },
  { code: 'uk', nativeName: 'Українська' },
  { code: 'ru', nativeName: 'Русский' },
  { code: 'pl', nativeName: 'Polski' },
  { code: 'cs', nativeName: 'Čeština' },
  { code: 'kk', nativeName: 'Қазақша' },
  { code: 'de', nativeName: 'Deutsch' },
];

export const translations = { en, uk, ru, pl, cs, kk, de };

// Если строки нет в выбранном языке, берётся английская.
// Он же — язык по умолчанию, если язык устройства не поддерживается.
export const FALLBACK_LANGUAGE = 'en';
