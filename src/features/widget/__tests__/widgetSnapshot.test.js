import { createTranslator } from '@/i18n/translator';

import { buildWidgetSnapshot } from '../widgetSnapshot';

const t = createTranslator('ru');
const NOW = new Date('2026-10-19T12:00:00.000Z');
const PROFILE = {
  nickname: 'Алекс',
  photoUri: 'data:image/jpeg;base64,AAAA',
  heightCm: 175,
  ageYears: 30,
  sex: 'male',
  weightUnit: 'kg',
  heightUnit: 'cm',
};
// записи веса, новые сверху
const entries = [
  { id: 3, weightKg: 92, measuredAt: '2026-10-19T06:00:00.000Z', createdAt: '2026-10-19T06:00:00.000Z', note: 'личная заметка' },
  { id: 2, weightKg: 92.5, measuredAt: '2026-10-15T06:00:00.000Z', createdAt: '2026-10-15T06:00:00.000Z', note: null },
  { id: 1, weightKg: 96, measuredAt: '2026-10-01T06:00:00.000Z', createdAt: '2026-10-01T06:00:00.000Z', note: null },
];
const loseGoal = [{ id: 1, goalType: 'lose', targetWeightKg: 88, startedAt: '2026-10-01T05:00:00.000Z' }];

const build = (extra) => buildWidgetSnapshot({ profile: PROFILE, weightEntries: entries, goals: loseGoal, t, language: 'ru', now: NOW, ...extra });

describe('снимок для виджета', () => {
  it('нет профиля — снимка нет (виджет предложит открыть приложение)', () => {
    expect(buildWidgetSnapshot({ profile: null, weightEntries: [], goals: [], t, language: 'ru', now: NOW })).toBeNull();
  });

  it('нет записей — пустой снимок с понятной подписью', () => {
    const snapshot = build({ weightEntries: [] });
    expect(snapshot).toMatchObject({ hasData: false, weight: null, goal: null });
    expect(snapshot.labels.empty).toBeTruthy();
  });

  it('вес, дата без «сегодня», изменение к прошлой записи и цвет по цели', () => {
    const snapshot = build();
    expect(snapshot).toMatchObject({ hasData: true, weight: '92', unit: 'кг', measuredAt: entries[0].measuredAt, changeTone: 'success' });
    expect(snapshot.dateText).toMatch(/19/);
    expect(snapshot.change).toBe('−0,5 кг');
  });

  it('цель и прогресс от старта цели', () => {
    const { goal } = build();
    expect(goal).toMatchObject({ type: 'lose', target: '88 кг', status: 'Осталось 4 кг' });
    expect(goal.progress).toBeCloseTo(0.5);
  });

  it('удержание: отклонение от цели без процента', () => {
    const { goal } = build({ goals: [{ id: 1, goalType: 'maintain', targetWeightKg: 92, startedAt: '2026-10-01T05:00:00.000Z' }] });
    expect(goal).toMatchObject({ type: 'maintain', progress: null, status: 'Вес на цели', statusTone: 'success' });
  });

  it('без цели и одна запись — без цели и без изменения', () => {
    const snapshot = build({ weightEntries: [entries[0]], goals: [{ id: 1, goalType: 'none', targetWeightKg: null, startedAt: NOW.toISOString() }] });
    expect(snapshot.goal).toBeNull();
    expect(snapshot.change).toBeNull();
    expect(snapshot.changeTone).toBe('neutral');
  });

  it('единицы пользователя (фунты)', () => {
    const snapshot = build({ profile: { ...PROFILE, weightUnit: 'lb' } });
    expect(snapshot.unit).toBe('фунт');
    expect(snapshot.weight).toBe('202,8');
  });

  it('в снимке нет личного: имени, фото, комментариев, роста, возраста, пола и истории', () => {
    const text = JSON.stringify(build());
    for (const secret of ['Алекс', 'base64', 'личная заметка', '175', '"male"', '96']) {
      expect(text).not.toContain(secret);
    }
  });
});
