// Вкладка «+» не открывается: нажатие на неё открывает форму новой записи веса
// (см. listeners в src/app/(tabs)/_layout.jsx). Файл нужен, чтобы кнопка была в панели.
import { Redirect } from 'expo-router';

export default function AddRoute() {
  return <Redirect href="/weight/new" />;
}
