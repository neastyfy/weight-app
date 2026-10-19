// Сохранение и выбор файлов в браузере.
//   saveTextFile — обычное скачивание файла (папка «Загрузки»);
//   pickTextFile — окно выбора файла; null — пользователь отменил выбор.
import * as DocumentPicker from 'expo-document-picker';

import { BACKUP_LIMITS } from './backupFormat';

export async function saveTextFile({ fileName, mimeType, text }) {
  const blob = new Blob([text], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // ссылку освобождаем чуть позже — браузер должен успеть начать скачивание
  setTimeout(() => URL.revokeObjectURL(url), 10000);
}

export async function pickTextFile() {
  const result = await DocumentPicker.getDocumentAsync({ type: ['application/json', '.json', 'text/plain'], multiple: false });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  if (asset.size != null && asset.size > BACKUP_LIMITS.maxFileChars * 4) return { name: asset.name, text: null, tooLarge: true };
  const text = asset.file ? await asset.file.text() : await (await fetch(asset.uri)).text();
  return { name: asset.name, text };
}
