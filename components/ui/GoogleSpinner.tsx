import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

interface GoogleSpinnerProps {
  size?: number;
}

/** Google's four brand colors, same set used by GoogleGlyph's "G" mark. */
const COLORS = ['#4285F4', '#EA4335', '#FBBC05', '#34A853'];

/**
 * Google's multi-color circular loading spinner — a ring split into four
 * equal arcs, one per brand color, rotating continuously. Used in place of
 * a plain single-tint ActivityIndicator wherever a "Continue with Google"
 * action is in flight, matching Google's own sign-in loading state instead
 * of an arbitrary solid-color spin.
 */
export function GoogleSpinner({ size = 20 }: GoogleSpinnerProps) {
  const rotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [rotation]);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const strokeWidth = Math.max(2, size * 0.12);
  const radius = size / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;
  const segmentLength = circumference / 4;

  return (
    <Animated.View style={{ width: size, height: size, transform: [{ rotate: spin }] }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {COLORS.map((color, i) => (
          <Circle
            key={color}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
            strokeDashoffset={-(i * segmentLength)}
            fill="none"
          />
        ))}
      </Svg>
    </Animated.View>
  );
}
