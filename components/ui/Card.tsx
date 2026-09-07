import React from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { theme } from '@/constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Softer background tint (e.g. tip banners) instead of pure white. */
  tinted?: boolean;
  padded?: boolean;
}

/** The rounded white card used everywhere: nutrition summaries, list rows, tips. */
export function Card({ children, style, tinted = false, padded = true }: CardProps) {
  return (
    <View
      style={[
        styles.base,
        tinted && { backgroundColor: theme.colors.brandTint },
        padded && styles.padded,
        !tinted && theme.shadows.card,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
  },
  padded: {
    padding: theme.spacing.lg,
  },
});
