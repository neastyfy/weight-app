// Настройка сборщика Metro.
// Нужна для локальной базы данных (expo-sqlite) в браузере:
// база работает через WebAssembly (.wasm) и SharedArrayBuffer,
// которому нужны заголовки COEP/COOP. На iOS эти настройки не влияют.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Разрешаем подключать файлы .wasm
config.resolver.assetExts.push('wasm');

// Заголовки для SharedArrayBuffer в браузере (сервер разработки)
config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    middleware(req, res, next);
  };
};

module.exports = config;
