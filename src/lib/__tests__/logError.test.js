import { DuplicateError } from '@/features/measurements/errors';

import { logError } from '../logError';

describe('лог ошибок без личных данных', () => {
  it('пишет только место, тип и текст ошибки — не вложенную запись', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    logError('Не удалось сохранить', new DuplicateError({ id: 7, weightKg: 92.4, measuredAt: '2026-10-19T08:00:00.000Z', note: 'личное' }));
    const logged = spy.mock.calls.flat().map(String).join(' ');
    expect(logged).toContain('Не удалось сохранить');
    expect(logged).toContain('DuplicateError');
    expect(logged).not.toMatch(/92\.4|личное|2026-10-19/);
    expect(spy.mock.calls[0]).toHaveLength(1); // одна строка, без объектов
    spy.mockRestore();
  });
});
