// Общая логика форм записей (вес и окружности): сохранение, ошибки, дубли, удаление.
//
//   const editor = useEntryEditor({
//     save: ({ allowDuplicate }) => addWeight(data, { allowDuplicate }),
//     remove: () => deleteWeight(id),     // только для редактирования
//     onDone: () => router.back(),
//   });
import { useState } from 'react';

import { DuplicateError, NotFoundError, ValidationError } from './errors';
import { logError } from '@/lib/logError';

export function useEntryEditor({ save, remove, onDone }) {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({}); // ошибки полей: { поле: { key, params } }
  const [failure, setFailure] = useState(null); // 'save' | 'delete' | 'notFound'
  const [duplicate, setDuplicate] = useState(null); // похожая запись — спросить пользователя
  const [askDelete, setAskDelete] = useState(false);

  const handleError = (error, operation) => {
    if (error instanceof ValidationError) setErrors(error.errors);
    else if (error instanceof DuplicateError) setDuplicate(error.duplicate);
    else if (error instanceof NotFoundError) setFailure('notFound');
    else {
      logError(`Не удалось выполнить: ${operation}`, error);
      setFailure(operation);
    }
  };

  const submit = async (allowDuplicate = false) => {
    setSaving(true);
    setErrors({});
    setFailure(null);
    setDuplicate(null);
    try {
      await save({ allowDuplicate });
      onDone();
    } catch (error) {
      handleError(error, 'save');
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    setSaving(true);
    try {
      await remove();
      setAskDelete(false);
      onDone();
    } catch (error) {
      setAskDelete(false);
      handleError(error, 'delete');
      setSaving(false);
    }
  };

  return {
    saving,
    errors,
    failure,
    duplicate,
    askDelete,
    submit,
    saveAnyway: () => submit(true),
    dismissDuplicate: () => setDuplicate(null),
    requestDelete: () => setAskDelete(true),
    cancelDelete: () => setAskDelete(false),
    confirmDelete,
    clearFieldError: (field) => setErrors(({ [field]: _removed, ...rest }) => rest),
  };
}
