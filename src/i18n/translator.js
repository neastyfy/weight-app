// Перевод строк без React — используется и в LanguageProvider, и в экране ошибки.
import { FALLBACK_LANGUAGE, translations } from './languages';

// Находит строку по ключу вида 'mascots.peach.name'
function lookup(dictionary, key) {
  return key.split('.').reduce((node, part) => (node == null ? undefined : node[part]), dictionary);
}

// Возвращает функцию t(key, params).
// Параметры подставляются в фигурные скобки: t('home.greeting', { name: 'Алекс' })
export function createTranslator(language) {
  return function t(key, params) {
    const text = lookup(translations[language], key) ?? lookup(translations[FALLBACK_LANGUAGE], key);
    if (typeof text !== 'string') return key;
    if (!params) return text;
    return text.replace(/\{(\w+)\}/g, (match, name) => (params[name] !== undefined ? String(params[name]) : match));
  };
}
