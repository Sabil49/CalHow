import React from 'react';
import { View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '@/constants/theme';

export interface DonutSegment {
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  strokeWidth?: number;
}

/**
 * Multi-segment ring built on react-native-svg (same stroke-dasharray
 * technique as ProgressRing, stacked per segment) — used for the
 * Macronutrient Balance chart on Progress.
 */
export function DonutChart({ segments, size = 120, strokeWidth = 16 }: DonutChartProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const total = segments.reduce((sum, s) => sum + s.value, 0) || 1;

  let cumulative = 0;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle cx={size / 2} cy={size / 2} r={radius} stroke={theme.palette.ink100} strokeWidth={strokeWidth} fill="none" />
        {segments.map((segment, i) => {
          const fraction = segment.value / total;
          const dashLength = circumference * fraction;
          const offset = circumference * (1 - cumulative / total);
          cumulative += segment.value;
          return (
            <Circle
              key={i}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={segment.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference}`}
              strokeDashoffset={offset}
              strokeLinecap="butt"
              fill="none"
              rotation={-90}
              origin={`${size / 2}, ${size / 2}`}
            />
          );
        })}
      </Svg>
    </View>
  );
}
