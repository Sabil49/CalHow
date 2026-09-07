import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Polyline } from 'react-native-svg';
import { theme } from '@/constants/theme';

interface LineChartMiniProps {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  /** Index to highlight with a filled dot, e.g. "today". */
  highlightIndex?: number;
}

/**
 * Small line/sparkline chart built directly on react-native-svg (no
 * charting library dependency) — used for the 7-day calorie trend on
 * Progress and Add Weight's weight trend.
 */
export function LineChartMini({ values, width = 280, height = 100, color = theme.colors.brandPrimary, highlightIndex }: LineChartMiniProps) {
  if (values.length === 0) {
    return <View style={{ width, height }} />;
  }

  const padding = 8;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = values.length === 1 ? width / 2 : padding + (i / (values.length - 1)) * (width - padding * 2);
    const y = height - padding - ((v - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');
  const baselineY = height - padding - ((0 - min) / range) * (height - padding * 2);

  return (
    <Svg width={width} height={height}>
      <Line x1={0} y1={baselineY} x2={width} y2={baselineY} stroke={theme.colors.border} strokeWidth={1} />
      <Polyline points={polylinePoints} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {points.map((p, i) => (
        <Circle
          key={i}
          cx={p.x}
          cy={p.y}
          r={i === highlightIndex ? 5 : 3}
          fill={i === highlightIndex ? color : theme.colors.card}
          stroke={color}
          strokeWidth={2}
        />
      ))}
    </Svg>
  );
}
