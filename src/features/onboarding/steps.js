// Порядок шагов онбординга. Чтобы добавить, убрать или переставить шаг — правьте этот список.
//
// Поля шага:
//   id        — имя шага (тексты шага в переводах: onboarding.<id>.title / subtitle)
//   Component — содержимое шага
//   fields    — какие поля черновика проверять перед переходом дальше
//   skip      — шаг необязательный: кнопка «Пропустить» и что она очищает
//   progress  — показывать ли шаг в индикаторе прогресса
//   scroll    — false, если на шаге вертикальная шкала (чтобы прокрутка не мешала её тянуть)
//   Footer    — блок, закреплённый над кнопками (например, итог активности)
import { ActivityFooter, ActivityStep } from './steps/ActivityStep';
import { AgeStep } from './steps/AgeStep';
import { GoalStep } from './steps/GoalStep';
import { HeightStep } from './steps/HeightStep';
import { LanguageStep } from './steps/LanguageStep';
import { MascotStep } from './steps/MascotStep';
import { NameStep } from './steps/NameStep';
import { SexStep } from './steps/SexStep';
import { SummaryStep } from './steps/SummaryStep';
import { UnitsStep } from './steps/UnitsStep';
import { WeightStep } from './steps/WeightStep';
import { WelcomeStep } from './steps/WelcomeStep';

export const STEPS = [
  { id: 'language', Component: LanguageStep, fields: [], progress: false },
  { id: 'welcome', Component: WelcomeStep, fields: [], progress: false },
  { id: 'name', Component: NameStep, fields: ['nickname'], progress: true },
  { id: 'mascot', Component: MascotStep, fields: [], progress: true },
  { id: 'units', Component: UnitsStep, fields: [], progress: true },
  { id: 'height', Component: HeightStep, fields: ['height'], progress: true, scroll: false },
  { id: 'weight', Component: WeightStep, fields: ['weight'], progress: true },
  { id: 'age', Component: AgeStep, fields: ['age'], progress: true },
  { id: 'sex', Component: SexStep, fields: [], progress: true },
  { id: 'activity', Component: ActivityStep, Footer: ActivityFooter, fields: [], progress: true },
  {
    id: 'goal',
    Component: GoalStep,
    fields: ['targetWeight'],
    progress: true,
    skip: { labelKey: 'onboarding.goal.skip', clear: { targetWeight: null } },
  },
  { id: 'summary', Component: SummaryStep, fields: [], progress: true },
];

export const SUMMARY_STEP_INDEX = STEPS.findIndex((step) => step.id === 'summary');
