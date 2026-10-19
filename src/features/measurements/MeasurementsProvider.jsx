// Измерения для всего приложения: записи веса и окружности тела.
// Использование в экране:
//   const { weightEntries, addWeight, updateWeight, deleteWeight } = useMeasurements();
// После любого изменения списки сразу обновляются — экраны перерисуются сами.
// Ошибки операций пробрасываются дальше (ValidationError, DuplicateError, NotFoundError),
// чтобы экран мог показать понятное сообщение.
import { useSQLiteContext } from '@/storage/sqlite';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  addBodyMeasurement,
  deleteBodyMeasurement,
  listBodyMeasurements,
  updateBodyMeasurement,
} from './bodyMeasurementRepository';
import { addWeightEntry, deleteWeightEntry, listWeightEntries, updateWeightEntry } from './weightRepository';
import { logError } from '@/lib/logError';

const MeasurementsContext = createContext(null);

export function MeasurementsProvider({ children }) {
  const db = useSQLiteContext();
  // status: 'loading' | 'ready' | 'error'
  const [state, setState] = useState({ status: 'loading', weightEntries: [], bodyMeasurements: [], error: null });

  const reload = useCallback(async () => {
    try {
      const [weightEntries, bodyMeasurements] = await Promise.all([listWeightEntries(db), listBodyMeasurements(db)]);
      setState({ status: 'ready', weightEntries, bodyMeasurements, error: null });
    } catch (error) {
      logError('Не удалось загрузить измерения', error);
      setState((previous) => ({ ...previous, status: 'error', error }));
    }
  }, [db]);

  useEffect(() => {
    reload();
  }, [reload]);

  // Выполнить операцию с базой и сразу обновить списки
  const withReload = useCallback(
    (operation) =>
      async (...args) => {
        const result = await operation(db, ...args);
        await reload();
        return result;
      },
    [db, reload],
  );

  const value = useMemo(
    () => ({
      ...state,
      latestWeight: state.weightEntries[0] ?? null, // список отсортирован: новые сверху
      reload,
      addWeight: withReload(addWeightEntry),
      updateWeight: withReload(updateWeightEntry),
      deleteWeight: withReload(deleteWeightEntry),
      addBodyMeasurement: withReload(addBodyMeasurement),
      updateBodyMeasurement: withReload(updateBodyMeasurement),
      deleteBodyMeasurement: withReload(deleteBodyMeasurement),
    }),
    [state, reload, withReload],
  );

  return <MeasurementsContext.Provider value={value}>{children}</MeasurementsContext.Provider>;
}

export function useMeasurements() {
  const context = useContext(MeasurementsContext);
  if (!context) {
    throw new Error('useMeasurements нужно вызывать внутри MeasurementsProvider');
  }
  return context;
}
