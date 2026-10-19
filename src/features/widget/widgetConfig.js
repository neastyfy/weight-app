// Общие настройки обмена данными с iOS-виджетом.
// Те же значения должны быть в app.json (ios.entitlements → application-groups)
// и в Swift-коде виджета (targets/weight-widget/WeightWidget.swift). Меняете здесь — меняйте и там.
export const WIDGET_APP_GROUP = 'group.com.weightapp.app';
export const WIDGET_SNAPSHOT_KEY = 'widgetSnapshot';
// Версия формата снимка: виджет проверяет её и не пытается показать незнакомый формат
export const WIDGET_SNAPSHOT_VERSION = 1;
// Через сколько дней без новых записей виджет показывает «давно не было записей»
export const WIDGET_STALE_AFTER_DAYS = 14;
