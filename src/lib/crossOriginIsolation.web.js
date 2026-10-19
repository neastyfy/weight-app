// ТОЛЬКО ДЛЯ БРАУЗЕРА (на iOS используется пустой crossOriginIsolation.js).
//
// База данных SQLite в браузере работает только на «изолированной» странице —
// для этого сервер должен прислать заголовки COOP/COEP (см. metro.config.js и app.json).
// Сервер разработки Expo не добавляет их для самого адреса «/», поэтому в этом
// случае один раз перезагружаем страницу через служебный адрес /start
// (там заголовки есть), а он сразу открывает Главную уже без перезагрузки.
if (typeof window !== 'undefined' && !window.crossOriginIsolated && window.location.pathname === '/') {
  window.location.replace('/start');
}
