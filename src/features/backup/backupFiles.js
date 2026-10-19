// Сохранение и выбор файлов на iOS (и Android). Для браузера — backupFiles.web.js.
//   saveTextFile — файл создаётся во временной папке и открывается системное меню
//                  «Поделиться»: «Сохранить в Файлы», AirDrop, почта и т. д.
//   pickTextFile — системный выбор файла; null — пользователь отменил выбор.
import * as DocumentPicker from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import { BACKUP_LIMITS } from './backupFormat';

// UTI — тип файла для меню «Поделиться» на iOS
const UTI = { 'application/json': 'public.json', 'text/csv': 'public.comma-separated-values-text' };

export async function saveTextFile({ fileName, mimeType, text }) {
  const file = new File(Paths.cache, fileName);
  if (file.exists) file.delete();
  await file.write(text);
  if (!(await Sharing.isAvailableAsync())) throw new Error('sharingUnavailable');
  await Sharing.shareAsync(file.uri, { mimeType, UTI: UTI[mimeType], dialogTitle: fileName });
}

export async function pickTextFile() {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/json', 'text/plain', 'public.json', '*/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.length) return null;
  const asset = result.assets[0];
  if (asset.size != null && asset.size > BACKUP_LIMITS.maxFileChars * 4) return { name: asset.name, text: null, tooLarge: true };
  const text = await new File(asset.uri).text();
  return { name: asset.name, text };
}
