// Service worker WeightApp — чтобы установленное на экран «Домой» приложение открывалось без интернета.
// Данные пользователя здесь не хранятся (они в базе SQLite в браузере) — только файлы самого приложения.
//
// Стратегия:
//   • страница (index.html) — сначала сеть, при отсутствии сети — сохранённая копия.
//     Так после деплоя новой версии приложение обновится при следующем запуске с интернетом;
//   • файлы сборки (/_expo/static, /assets, шрифты, иконки) — сначала из кеша:
//     их имена содержат хеш, поэтому новая версия всегда приходит под новым именем.
// При изменении этой логики увеличьте CACHE_VERSION — старый кеш удалится.
const CACHE_VERSION = 'v3'; // v3: база в IndexedDB, без заголовков COOP/COEP
const CACHE_NAME = `weightapp-${CACHE_VERSION}`;

self.addEventListener('install', (event) => {
  // Сразу кешируем саму страницу, чтобы первый офлайн-запуск тоже работал
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.add('/'))
      .catch(() => {})
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('weightapp-') && key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

function isStaticFile(url) {
  return url.pathname.startsWith('/_expo/') || url.pathname.startsWith('/assets/') || /\.(png|jpg|jpeg|webp|ttf|otf|woff2?|wasm|ico)$/.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Страницы приложения: сеть → кеш
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put('/', copy));
          return response;
        })
        .catch(() => caches.match('/')),
    );
    return;
  }

  // Файлы сборки: кеш → сеть (и сохранить в кеш)
  if (isStaticFile(url)) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
  }
});
