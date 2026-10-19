// Выбор фото профиля из галереи (на iOS — с обрезкой в квадрат, в браузере — выбор файла).
// Фото уменьшается до 320 px по короткой стороне и сжимается в JPEG,
// чтобы его можно было хранить прямо в локальной базе (около 20–40 КБ).
//
// Возвращает data-URI картинки или null, если пользователь передумал.
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { launchImageLibraryAsync } from 'expo-image-picker';

const PHOTO_SIZE = 320;
const JPEG_QUALITY = 0.8;

export async function pickProfilePhoto() {
  const result = await launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true, // встроенная обрезка на iOS
    aspect: [1, 1],
    quality: 1,
  });
  if (result.canceled || !result.assets?.length) return null;

  const asset = result.assets[0];
  // Уменьшаем по короткой стороне: квадрат для аватара вырежет отображение (cover)
  const resize = (asset.width ?? 0) > (asset.height ?? 0) ? { height: PHOTO_SIZE } : { width: PHOTO_SIZE };

  const rendered = await ImageManipulator.manipulate(asset.uri).resize(resize).renderAsync();
  const saved = await rendered.saveAsync({ base64: true, compress: JPEG_QUALITY, format: SaveFormat.JPEG });
  return `data:image/jpeg;base64,${saved.base64}`;
}
