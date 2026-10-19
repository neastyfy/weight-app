// Подписи дат для графиков и сводки (всегда в местном времени пользователя).
import { formatShortDate, getLocale } from '@/lib/format';

import { getRangeDays, getRangeLastDay } from './chartModel';

// Подпись на оси времени: «12 окт.» для коротких периодов, «окт. 26» — для длинных (больше ~2 месяцев)
export function formatAxisDate(date, language, range) {
  const long = getRangeDays(range) > 62;
  const options = long ? { month: 'short', year: '2-digit' } : { day: 'numeric', month: 'short' };
  return new Intl.DateTimeFormat(getLocale(language), options).format(date);
}

// Границы периода: «13 окт. – 19 окт.»
export function formatRangeLabel(range, language, now = new Date()) {
  return `${formatShortDate(range.start, language, now)} – ${formatShortDate(getRangeLastDay(range), language, now)}`;
}
