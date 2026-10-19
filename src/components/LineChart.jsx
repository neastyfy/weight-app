// Линейный график на react-native-svg (работает и на iOS, и в браузере).
//
// Рисует только переданные точки — ничего не сглаживает и не досчитывает:
// точки соединены прямыми отрезками, каждая реальная запись видна кружком.
// Ось времени — настоящие даты: пропуски между записями видны как расстояние.
// Касание или протягивание пальцем выбирает ближайшую по времени точку (onSelect).
//
// Пример:
//   <LineChart
//     points={[{ id: 1, time: 1760000000000, value: 80.2 }, …]}
//     start={range.start} end={range.end}
//     selectedId={selectedId} onSelect={(point) => setSelectedId(point.id)}
//     formatValue={(v) => formatNumber(v, language, 1)}
//     formatDate={(date) => '12 окт.'}
//   />
// points должен содержать хотя бы одну точку (пустое состояние показывает экран).
// color — цвет линии (ключ темы); под линией — мягкая заливка того же цвета (если нет цветных зон).
// bands — цветные зоны фона по значению (например, категории ИМТ): [{ from, to, color }]
import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';

import { getValueTicks } from '@/lib/chartTicks';
import { fonts, useTheme } from '@/theme';

const PADDING = { top: 12, right: 14, bottom: 26, left: 44 };

export function LineChart({ points, start, end, selectedId, onSelect, formatValue, formatDate, bands = [], height = 210, color = 'primary' }) {
  const { colors } = useTheme();
  const [width, setWidth] = useState(0);

  const plotWidth = Math.max(0, width - PADDING.left - PADDING.right);
  const plotHeight = height - PADDING.top - PADDING.bottom;

  const values = points.map((point) => point.value);
  const ticks = getValueTicks(Math.min(...values), Math.max(...values));
  const low = ticks[0];
  const high = ticks[ticks.length - 1];

  const startTime = start.getTime();
  const span = Math.max(1, end.getTime() - startTime);
  const xOf = (time) => PADDING.left + ((time - startTime) / span) * plotWidth;
  const yOf = (value) => PADDING.top + (1 - (value - low) / (high - low)) * plotHeight;

  // Ближайшая по горизонтали точка к месту касания
  const selectAt = (x) => {
    if (!points.length || !onSelect) return;
    let best = points[0];
    for (const point of points) {
      if (Math.abs(xOf(point.time) - x) < Math.abs(xOf(best.time) - x)) best = point;
    }
    if (best.id !== selectedId) onSelect(best);
  };

  const path = points.map((point, index) => `${index ? 'L' : 'M'}${xOf(point.time)},${yOf(point.value)}`).join(' ');
  const selected = points.find((point) => point.id === selectedId) ?? null;
  const lineColor = colors[color];
  // Заливка под линией: от линии до низа графика, сверху вниз прозрачнеет
  const bottomY = PADDING.top + plotHeight;
  const areaPath =
    points.length > 1 && bands.length === 0
      ? `${path} L${xOf(points[points.length - 1].time)},${bottomY} L${xOf(points[0].time)},${bottomY} Z`
      : null;

  // Подписи дат: начало, середина и последний день периода
  const lastDay = new Date(end.getTime() - 1);
  const middle = new Date(startTime + span / 2);
  const dateLabels = [
    { date: start, x: PADDING.left, anchor: 'start' },
    { date: middle, x: PADDING.left + plotWidth / 2, anchor: 'middle' },
    { date: lastDay, x: PADDING.left + plotWidth, anchor: 'end' },
  ];

  return (
    <View style={{ height }} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 ? (
        <Svg width={width} height={height}>
          <Defs>
            <LinearGradient id="line-chart-area" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={lineColor} stopOpacity={0.22} />
              <Stop offset="1" stopColor={lineColor} stopOpacity={0} />
            </LinearGradient>
          </Defs>

          {/* Цветные зоны фона */}
          {bands.map((band) => {
            const top = yOf(Math.min(high, band.to));
            const bottom = yOf(Math.max(low, band.from));
            if (bottom <= top) return null;
            return <Rect key={`${band.from}-${band.to}`} x={PADDING.left} y={top} width={plotWidth} height={bottom - top} fill={band.color} />;
          })}

          {/* Сетка и подписи значений */}
          {ticks.map((tick) => (
            <Line key={`g${tick}`} x1={PADDING.left} x2={PADDING.left + plotWidth} y1={yOf(tick)} y2={yOf(tick)} stroke={colors.border} strokeWidth={1} />
          ))}
          {ticks.map((tick) => (
            <SvgText
              key={`t${tick}`}
              x={PADDING.left - 8}
              y={yOf(tick) + 4}
              fontSize={11}
              fontFamily={fonts.semiBold}
              fill={colors.textTertiary}
              textAnchor="end"
            >
              {formatValue(tick)}
            </SvgText>
          ))}
          {dateLabels.map((label) => (
            <SvgText
              key={label.anchor}
              x={label.x}
              y={height - 6}
              fontSize={11}
              fontFamily={fonts.semiBold}
              fill={colors.textTertiary}
              textAnchor={label.anchor}
            >
              {formatDate(label.date)}
            </SvgText>
          ))}

          {/* Вертикальная линия к выбранной точке */}
          {selected ? (
            <Line
              x1={xOf(selected.time)}
              x2={xOf(selected.time)}
              y1={PADDING.top}
              y2={PADDING.top + plotHeight}
              stroke={lineColor}
              strokeOpacity={0.35}
              strokeWidth={1.5}
              strokeDasharray="4 4"
            />
          ) : null}

          {areaPath ? <Path d={areaPath} fill="url(#line-chart-area)" /> : null}

          {/* Линия и точки — только реальные записи */}
          {points.length > 1 ? (
            <Path d={path} stroke={lineColor} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
          ) : null}
          {points.map((point) => (
            <Circle
              key={point.id}
              cx={xOf(point.time)}
              cy={yOf(point.value)}
              r={point.id === selectedId ? 6.5 : points.length > 60 ? 2.5 : 4}
              fill={point.id === selectedId ? colors.surface : lineColor}
              stroke={lineColor}
              strokeWidth={point.id === selectedId ? 3 : 0}
            />
          ))}
        </Svg>
      ) : null}

      {/* Прозрачный слой поверх графика ловит касания: координата всегда относительно него */}
      <View
        testID="line-chart-touch"
        style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderGrant={(event) => selectAt(event.nativeEvent.locationX)}
        onResponderMove={(event) => selectAt(event.nativeEvent.locationX)}
        onResponderTerminationRequest={() => true}
      />
    </View>
  );
}
