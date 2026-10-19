// Понятные ошибки операций с измерениями — интерфейс показывает по ним нужное сообщение.

export class ValidationError extends Error {
  constructor(errors) {
    super('Данные не прошли проверку');
    this.name = 'ValidationError';
    this.errors = errors; // { поле: { key, params } }
  }
}

export class DuplicateError extends Error {
  constructor(duplicate) {
    super('Похоже на случайный повтор записи');
    this.name = 'DuplicateError';
    this.duplicate = duplicate; // найденная похожая запись
  }
}

export class NotFoundError extends Error {
  constructor() {
    super('Запись не найдена');
    this.name = 'NotFoundError';
  }
}
