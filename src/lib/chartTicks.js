// Деления оси значений для графиков (тесты: src/features/charts/__tests__/chartModel.test.js).

// «Красивые» деления оси значений: [min..max] → 3–5 ровных чисел (шаг 0,1 / 0,2 / 0,5 / 1 / 2 / 5 …).
// Если все значения одинаковые, ось расширяется на ±1 шаг, чтобы точка была посередине.
export function getValueTicks(minValue, maxValue, targetCount = 4) {
  let low = minValue;
  let high = maxValue;
  if (high - low < 1e-9) {
    const pad = Math.max(Math.abs(low) * 0.01, 0.5);
    low -= pad;
    high += pad;
  }
  const rawStep = (high - low) / (targetCount - 1);
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const step = [1, 2, 5, 10].map((m) => m * magnitude).find((candidate) => candidate >= rawStep) ?? 10 * magnitude;
  const first = Math.floor(low / step) * step;
  const last = Math.ceil(high / step) * step;
  const ticks = [];
  for (let value = first; value <= last + step / 2; value += step) {
    ticks.push(Math.round(value / step) * step);
  }
  return ticks;
}
