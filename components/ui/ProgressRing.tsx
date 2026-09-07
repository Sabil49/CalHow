import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { theme } from '@/constants/theme';

interface ProgressRingProps {
  /** 0-100 */
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  /** Rendered centered inside the ring, e.g. "68%" + "of goal". Pass your own for full control. */
  children?: React.ReactNode;
}

/**
 * Circular progress ring, added beyond the originally-listed primitives
 * because it recurs constantly across the reference screens: the "X% of
 * goal" rings on Home/Progress, and the "72% Analyzing..." ring on the AI
 * Analyzing screen. Centralizing it here avoids re-deriving the SVG math
 * per screen.
 */
export function ProgressRing({
  progress,
  size = 96,
  strokeWidth = 8,
  color = theme.colors.brandPrimary,
  trackColor = theme.palette.ink100,
  children,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, progress));
  const offset = circumference * (1 - clamped / 100);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
          fill="none"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {children && <View style={styles.center}>{children}</View>}
    </View>
  );
}

interface ProgressRingLabelProps {
  value: string;
  label?: string;
}

/** Common center content: a big percentage/number plus a small caption. */
export function ProgressRingLabel({ value, label }: ProgressRingLabelProps) {
  return (
    <View style={styles.labelWrap}>
      <Text style={styles.value}>{value}</Text>
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelWrap: {
    alignItems: 'center',
  },
  value: {
    fontFamily: theme.fontFamily.serifBold,
    fontSize: theme.fontSize.xl,
    color: theme.colors.textPrimary,
  },
  label: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
});
