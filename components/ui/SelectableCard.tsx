import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface SelectableCardProps {
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
  /** Feather icon rendered in a tinted circle, e.g. goal/activity icons. */
  icon?: keyof typeof Feather.glyphMap;
  iconColor?: string;
  /** 'row' for wide options (oil amount, list-style), 'column' for grid tiles (goal cards). */
  layout?: 'row' | 'column';
  /** Shows a radio circle (row layout) vs a checkmark badge (column layout). */
  indicator?: 'radio' | 'check' | 'none';
  /** Override sizing, e.g. `{ width: '48%' }` for a 2-column grid. */
  style?: StyleProp<ViewStyle>;
}

/**
 * Selectable option card used for: goal type, activity level, oil amount
 * clarification, and similar single-choice pickers throughout onboarding
 * and the scan flow.
 */
export function SelectableCard({
  title,
  description,
  selected,
  onPress,
  icon,
  iconColor,
  layout = 'row',
  indicator = layout === 'row' ? 'radio' : 'check',
  style,
}: SelectableCardProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.base,
        layout === 'column' ? styles.column : styles.row,
        selected && styles.selected,
        style,
      ]}
    >
      {icon && (
        <View
          style={[
            styles.iconCircle,
            layout === 'column' && styles.iconCircleColumn,
            { backgroundColor: selected ? theme.colors.brandTint : theme.palette.lime50 },
          ]}
        >
          <Feather name={icon} size={layout === 'column' ? 22 : 18} color={iconColor ?? theme.colors.brandDark} />
        </View>
      )}

      <View style={[styles.textBlock, layout === 'row' && { flex: 1 }]}>
        <Text style={[styles.title, selected && styles.titleSelected]}>{title}</Text>
        {description && <Text style={styles.description}>{description}</Text>}
      </View>

      {indicator === 'radio' && (
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected && <View style={styles.radioDot} />}
        </View>
      )}
      {indicator === 'check' && selected && (
        <View style={styles.checkBadge}>
          <Feather name="check" size={12} color={theme.colors.textInverse} />
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.radius.lg,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
  },
  column: {
    alignItems: 'flex-start',
    padding: theme.spacing.md,
    gap: theme.spacing.xs,
    position: 'relative',
  },
  selected: {
    borderColor: theme.colors.brandPrimary,
    backgroundColor: theme.colors.brandTint,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircleColumn: {
    width: 48,
    height: 48,
  },
  textBlock: {
    gap: 2,
  },
  title: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  titleSelected: {
    color: theme.colors.brandDark,
  },
  description: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: theme.radius.pill,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: {
    borderColor: theme.colors.brandPrimary,
  },
  radioDot: {
    width: 11,
    height: 11,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brandPrimary,
  },
  checkBadge: {
    position: 'absolute',
    top: theme.spacing.sm,
    right: theme.spacing.sm,
    width: 20,
    height: 20,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
