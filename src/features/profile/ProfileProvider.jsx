// Профиль пользователя для всего приложения.
// Использование в экране:
//   const { profile, latestWeight, metrics, goals, setGoal, updateProfile } = useProfile();
// profile === null — профиля ещё нет (показывается онбординг).
// Последний вес берётся из измерений (useMeasurements), поэтому после добавления,
// правки или удаления записи показатели (ИМТ, BMR) пересчитываются сразу.
import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { getBodyMetrics } from '@/features/calculations';
import { determineGoalType, getGoalProgress } from '@/features/goals/goalModel';
import { listGoals, setGoal as saveGoal } from '@/features/goals/goalsRepository';
import { restoreBackupData } from '@/features/backup/backupRepository';
import { useMeasurements } from '@/features/measurements/MeasurementsProvider';
import { cancelReminders } from '@/features/reminders/reminders';
import { useTranslation } from '@/i18n';
import { useTheme } from '@/theme';
import { logError } from '@/lib/logError';

import {
  createProfile,
  deleteAllUserData,
  listProfileVersions,
  loadProfile,
  updateProfile as saveProfileChanges,
  updateProfilePhoto,
} from './profileRepository';

const ProfileContext = createContext(null);

export function ProfileProvider({ children }) {
  const db = useSQLiteContext();
  const measurements = useMeasurements();
  // status: 'loading' | 'ready' | 'error'
  const [state, setState] = useState({ status: 'loading', profile: null, goals: [], profileVersions: [], error: null });
  const { reload: reloadLanguage } = useTranslation();
  const { reload: reloadTheme } = useTheme();

  const reload = useCallback(async () => {
    setState((previous) => ({ ...previous, status: 'loading', error: null }));
    try {
      const [profile, goals, profileVersions] = await Promise.all([loadProfile(db), listGoals(db), listProfileVersions(db)]);
      setState({ status: 'ready', profile, goals, profileVersions, error: null });
    } catch (error) {
      logError('Не удалось загрузить профиль', error);
      setState({ status: 'error', profile: null, goals: [], profileVersions: [], error });
    }
  }, [db]);

  useEffect(() => {
    reload();
  }, [reload]);

  const reloadMeasurements = measurements.reload;

  // Сохраняет новый профиль. Ошибку пробрасывает дальше — экран покажет её пользователю.
  const saveNewProfile = useCallback(
    async ({ profile, initialWeightKg }) => {
      await createProfile(db, profile, initialWeightKg);
      await reloadMeasurements();
      await reload();
    },
    [db, reload, reloadMeasurements],
  );

  // Меняет фото профиля (null — стандартное фото). Ошибку пробрасывает дальше.
  const setProfilePhoto = useCallback(
    async (photoUri) => {
      await updateProfilePhoto(db, photoUri, new Date().toISOString());
      setState((previous) => ({ ...previous, profile: { ...previous.profile, photoUri } }));
    },
    [db],
  );

  // Изменение профиля: имя, маскот, единицы, рост, возраст, пол, активность.
  // Параметры, влияющие на расчёты, сохраняются новой версией с датой (см. profileVersions.js).
  // Значения должны быть уже проверены. Ошибку пробрасывает дальше.
  const updateProfile = useCallback(
    async (changes) => {
      await saveProfileChanges(db, changes);
      await reload();
    },
    [db, reload],
  );

  // Меняет имя (уже проверенное validateNickname). Ошибку пробрасывает дальше.
  const setNickname = useCallback((nickname) => updateProfile({ nickname: nickname.trim() }), [updateProfile]);

  // Новая цель. targetWeightKg — целевой вес (для 'none' не нужен).
  // Тип цели можно передать явно (например, 'maintain'), иначе он определяется по текущему весу.
  const latestWeightKg = measurements.latestWeight?.weightKg ?? null;
  const setGoal = useCallback(
    async ({ targetWeightKg, goalType }) => {
      const type = goalType ?? determineGoalType(targetWeightKg, latestWeightKg);
      await saveGoal(db, { goalType: type, targetWeightKg });
      await reload();
    },
    [db, reload, latestWeightKg],
  );

  // После удаления или восстановления всё перечитывается из базы: язык, тема, измерения, профиль
  const reloadEverything = useCallback(async () => {
    await Promise.all([reloadLanguage(), reloadTheme(), reloadMeasurements()]);
    await reload();
  }, [reload, reloadLanguage, reloadTheme, reloadMeasurements]);

  // Удаляет все данные и отменяет напоминание — приложение вернётся к первому запуску
  const resetAllData = useCallback(async () => {
    await deleteAllUserData(db);
    await cancelReminders().catch((error) => logError('Не удалось отменить напоминание', error));
    await reloadEverything();
  }, [db, reloadEverything]);

  // Полная замена данных резервной копией (data — результат parseBackup). Одна транзакция.
  const restoreBackup = useCallback(
    async (data) => {
      await restoreBackupData(db, data);
      await reloadEverything();
    },
    [db, reloadEverything],
  );

  const latestWeight = measurements.latestWeight;

  const value = useMemo(() => {
    const { profile } = state;
    return {
      ...state,
      latestWeight,
      // Расчётные показатели (ИМТ, BMR, категория активности) — только если есть профиль
      metrics: profile ? getBodyMetrics(profile, latestWeight?.weightKg ?? null) : null,
      // Состояние цели: 'inProgress' | 'reached' | 'exceeded' | null
      goalProgress: profile
        ? getGoalProgress({
            goalType: profile.goalType,
            targetWeightKg: profile.targetWeightKg,
            currentWeightKg: latestWeight?.weightKg ?? null,
          })
        : null,
      reload,
      setGoal,
      saveNewProfile,
      setProfilePhoto,
      setNickname,
      updateProfile,
      resetAllData,
      restoreBackup,
    };
  }, [state, latestWeight, reload, saveNewProfile, setProfilePhoto, setNickname, updateProfile, setGoal, resetAllData, restoreBackup]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile() {
  const context = useContext(ProfileContext);
  if (!context) {
    throw new Error('useProfile нужно вызывать внутри ProfileProvider');
  }
  return context;
}
