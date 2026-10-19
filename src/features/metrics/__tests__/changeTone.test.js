import { getChangeTone, getMaintainTone, getWeightEntryTone } from '../changeTone';

describe('цвет записи веса', () => {
  it('похудение: снижение — хорошо, рост — красный', () => {
    const goal = { goalType: 'lose', targetWeightKg: 68 };
    expect(getWeightEntryTone({ change: -0.4, weightKg: 70, goal })).toBe('success');
    expect(getWeightEntryTone({ change: 0.6, weightKg: 71, goal })).toBe('error');
    expect(getWeightEntryTone({ change: 0.01, weightKg: 70, goal })).toBeNull();
  });

  it('набор: наоборот', () => {
    const goal = { goalType: 'gain', targetWeightKg: 60 };
    expect(getWeightEntryTone({ change: 0.4, weightKg: 58, goal })).toBe('success');
    expect(getWeightEntryTone({ change: -0.4, weightKg: 57, goal })).toBe('error');
  });

  it('удержание: важно отклонение от цели, а не изменение', () => {
    const goal = { goalType: 'maintain', targetWeightKg: 95 };
    expect(getWeightEntryTone({ change: -0.1, weightKg: 94.9, goal })).toBe('caution'); // чуть ниже цели
    expect(getWeightEntryTone({ change: 0.1, weightKg: 95, goal })).toBe('success'); // вернулся к цели — хорошо, хоть и рост
    expect(getWeightEntryTone({ change: 2, weightKg: 98, goal })).toBe('caution'); // ровно на границе зазора
    expect(getWeightEntryTone({ change: 1, weightKg: 98.5, goal })).toBe('error');
    expect(getWeightEntryTone({ change: -3, weightKg: 91.5, goal })).toBe('error');
  });

  it('без цели — без цвета', () => {
    expect(getWeightEntryTone({ change: -1, weightKg: 70, goal: null })).toBeNull();
    expect(getWeightEntryTone({ change: -1, weightKg: 70, goal: { goalType: 'none', targetWeightKg: null } })).toBeNull();
  });
});

describe('зазор удержания', () => {
  it('±3 кг', () => {
    expect(getMaintainTone(95.02, 95)).toBe('success');
    expect(getMaintainTone(97.9, 95)).toBe('caution');
    expect(getMaintainTone(91.9, 95)).toBe('error');
  });
});

describe('цвет окружностей', () => {
  it('удержание веса: без изменений — хорошо, иначе жёлтый (не красный)', () => {
    expect(getChangeTone(0, 'maintain')).toBe('success');
    expect(getChangeTone(1.2, 'maintain')).toBe('caution');
  });

  it('похудение и набор — по направлению', () => {
    expect(getChangeTone(-1, 'lose')).toBe('success');
    expect(getChangeTone(1, 'lose')).toBe('error');
    expect(getChangeTone(1, 'gain')).toBe('success');
    expect(getChangeTone(-1, null)).toBeNull();
  });
});
