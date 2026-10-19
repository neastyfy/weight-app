// Форматирование чисел и дат для показа пользователю с учётом языка:
// «72,4» по-русски и «72.4» по-английски.
import { fromCm, fromKg } from './units';

// Код языка приложения → региональный стандарт для Intl
const LOCALES = {
  en: 'en-GB',
  uk: 'uk-UA',
  ru: 'ru-RU',
  pl: 'pl-PL',
  cs: 'cs-CZ',
  kk: 'kk-KZ',
  de: 'de-DE',
};

export function getLocale(language) {
  return LOCALES[language] ?? LOCALES.en;
}

export function formatNumber(value, language, maxDigits = 0) {
  return new Intl.NumberFormat(getLocale(language), {
    maximumFractionDigits: maxDigits,
    minimumFractionDigits: 0,
  }).format(value);
}

// Вес из килограммов в выбранной единице: 72.4 → «72,4» (или «159,6» для фунтов)
export function formatWeight(kg, unit, language) {
  return formatNumber(fromKg(kg, unit), language, 1);
}

// Рост из сантиметров в выбранной единице: 175 → «175» (или «68,9» для дюймов)
export function formatHeight(cm, unit, language) {
  return formatNumber(fromCm(cm, unit), language, unit === 'in' ? 1 : 0);
}

// Дата: «16 апреля»
export function formatDate(isoString, language) {
  return new Intl.DateTimeFormat(getLocale(language), { day: 'numeric', month: 'long' }).format(new Date(isoString));
}

// Время «07:30» в местном часовом поясе
export function formatTime(isoString, language) {
  return new Intl.DateTimeFormat(getLocale(language), { hour: '2-digit', minute: '2-digit' }).format(new Date(isoString));
}

// Дата с годом: «19 октября 2026 г.»
export function formatFullDate(isoString, language) {
  return new Intl.DateTimeFormat(getLocale(language), { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(isoString));
}

// Дата и время для подтверждений: «19 октября, 07:30»
export function formatDateTime(isoString, language) {
  return new Intl.DateTimeFormat(getLocale(language), { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' }).format(
    new Date(isoString),
  );
}

// Окружность из сантиметров в выбранной единице: 82.5 → «82,5» (или «32,5» для дюймов)
export function formatCircumference(cm, unit, language) {
  return formatNumber(fromCm(cm, unit), language, 1);
}

// Изменение со знаком: «+0,3» / «−1,2» (настоящий минус, а не дефис)
export function formatSignedChange(value, language, digits = 1) {
  const formatted = formatNumber(Math.abs(value), language, digits);
  // после округления ноль — без знака
  if (Math.round(Math.abs(value) * 10 ** digits) === 0) return formatted;
  return `${value > 0 ? '+' : '−'}${formatted}`;
}

// Заглавная только первая буква строки: «октябрь 2026 г.» → «Октябрь 2026 г.»
export function capitalizeFirst(text) {
  return text ? text.charAt(0).toLocaleUpperCase() + text.slice(1) : text;
}

// Короткая дата «12 окт.»; с годом, если он не текущий
export function formatShortDate(date, language, now = new Date()) {
  const value = new Date(date);
  return new Intl.DateTimeFormat(getLocale(language), {
    day: 'numeric',
    month: 'short',
    year: value.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  }).format(value);
}
