// Виджет главного экрана есть только на iOS (см. widgetStorage.ios.js).
// В браузере и на Android снимок никуда не записывается.
export const WIDGET_SUPPORTED = false;

export function writeWidgetSnapshot() {}
