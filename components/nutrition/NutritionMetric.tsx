import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

export type NutritionKind = 'calories' | 'carbs' | 'fats' | 'protein' | 'fiber' | 'water';

interface NutritionMetricProps {
  kind: NutritionKind;
  /** Pre-formatted value, e.g. "480 kcal" or "42 g". Kept as a string so callers control units/rounding. */
  value: string;
  label: string;
  /** Optional secondary line, e.g. "52%" macro share shown under the value. */
  helperText?: string;
  helperColor?: string;
  size?: 'sm' | 'md';
}

const KIND_CONFIG: Record<NutritionKind, { icon: keyof typeof Feather.glyphMap; color: string }> = {
  calories: { icon: 'zap', color: theme.colors.nutrition.calories },
  carbs: { icon: 'feather', color: theme.colors.nutrition.carbs },
  fats: { icon: 'droplet', color: theme.colors.nutrition.fats },
  protein: { icon: 'box', color: theme.colors.nutrition.protein },
  fiber: { icon: 'feather', color: theme.colors.nutrition.fiber },
  water: { icon: 'droplet', color: theme.colors.nutrition.water },
};

/**
 * Single nutrition stat block (icon + numeric value + label), used in the
 * "Estimated nutrition", "Nutrition summary", and "Meal summary" cards.
 * Lay several out in a row with even spacing/dividers at the call site.
 */
export function NutritionMetric({
  kind,
  value,
  label,
  helperText,
  helperColor,
  size = 'md',
}: NutritionMetricProps) {
  const config = KIND_CONFIG[kind];

  return (
    <View style={styles.wrapper}>
      <Feather name={config.icon} size={size === 'sm' ? 14 : 16} color={config.color} />
      <Text style={[styles.label, size === 'sm' && styles.labelSm]}>{label}</Text>
      <Text style={[styles.value, size === 'sm' && styles.valueSm]}>{value}</Text>
      {helperText && (
        <Text style={[styles.helper, { color: helperColor ?? config.color }]}>{helperText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  label: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  labelSm: {
    fontSize: 11,
  },
  value: {
    fontFamily: theme.fontFamily.sansBold,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
  },
  valueSm: {
    fontSize: theme.fontSize.base,
  },
  helper: {
    ...theme.text.caption,
    fontSize: 11,
    fontFamily: theme.fontFamily.sansSemiBold,
  },
});
