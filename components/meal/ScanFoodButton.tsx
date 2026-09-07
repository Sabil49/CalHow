import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface ScanFoodButtonProps {
  onPress: () => void;
  size?: number;
}

/** The dark circular "Scan Food / Press to scan" button overlaid on Home's hero photo. */
export function ScanFoodButton({ onPress, size = 130 }: ScanFoodButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel="Scan food, press to open camera"
    >
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
        <Feather name="maximize" size={size * 0.22} color={theme.colors.brandLight} />
        <Text style={styles.title}>Scan Food</Text>
        <Text style={styles.subtitle}>Press to scan</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    backgroundColor: theme.palette.black,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderWidth: 2,
    borderColor: theme.colors.brandLight,
    ...theme.shadows.floating,
  },
  title: {
    ...theme.text.bodyMedium,
    color: theme.colors.textInverse,
    fontSize: theme.fontSize.sm,
  },
  subtitle: {
    ...theme.text.caption,
    fontSize: 10,
    color: theme.colors.brandLight,
  },
});
