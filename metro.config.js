// Настройка сборщика Metro.
// Разрешаем подключать файлы .wasm: в браузере база SQLite (sql.js) работает
// через WebAssembly (см. src/storage/sqlite.web.js). На iOS эта настройка не влияет.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.assetExts.push('wasm');

module.exports = config;
