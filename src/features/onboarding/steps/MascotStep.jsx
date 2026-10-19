// Шаг: выбор маскота.
import { MascotPicker } from '@/features/mascots';

export function MascotStep({ draft, update }) {
  return <MascotPicker value={draft.mascotId} onChange={(mascotId) => update({ mascotId })} />;
}
