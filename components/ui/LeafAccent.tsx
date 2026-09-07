import React from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface LeafAccentProps {
  size?: number;
  color?: string;
  rotation?: number;
  style?: StyleProp<TextStyle>;
}

/**
 * Small decorative leaf, scattered around hero photography in the
 * reference screens (Welcome, Login, Signup, onboarding). Feather's icon
 * set has no literal "leaf" glyph, so `feather` (rotated) doubles as the
 * closest stand-in silhouette.
 */
export function LeafAccent({ size = 20, color = theme.colors.brandPrimary, rotation = -20, style }: LeafAccentProps) {
  return (
    <Feather
      name="feather"
      size={size}
      color={color}
      style={[{ transform: [{ rotate: `${rotation}deg` }] }, style]}
    />
  );
}
