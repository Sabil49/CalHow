import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { MealThumbnail } from '@/components/ui/MealThumbnail';
import { theme } from '@/constants/theme';
import type { FoodItem } from '@/types/models';

interface DetectedFoodRowProps {
  food: FoodItem;
  editable?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

function confidenceColor(confidence?: number): string {
  if (confidence == null) return theme.colors.textMuted;
  if (confidence >= 0.9) return theme.colors.success;
  if (confidence >= 0.7) return theme.colors.warning;
  return theme.colors.error;
}

export function DetectedFoodRow({ food, editable = false, onEdit, onDelete }: DetectedFoodRowProps) {
  return (
    <View style={styles.row}>
      <MealThumbnail imageUri={food.imageUrl} size={52} style={styles.thumb} />

      <View style={styles.textCol}>
        <Text style={styles.name} numberOfLines={1}>
          {food.name}
        </Text>
        <View style={styles.metaRow}>
          <Text style={styles.portion} numberOfLines={1} ellipsizeMode="tail">
            {food.portionLabel}
          </Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.kcal}>{food.calories} kcal</Text>
        </View>
      </View>

      {food.confidence != null && (
        <View style={styles.confidenceCol}>
          <Text style={[styles.confidenceValue, { color: confidenceColor(food.confidence) }]}>
            {Math.round(food.confidence * 100)}%
          </Text>
          <Text style={styles.confidenceLabel}>Confidence</Text>
        </View>
      )}

      {editable && (
        <View style={styles.actions}>
          <Pressable onPress={onEdit} style={[styles.actionButton, styles.editButton]} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Edit ${food.name}`}>
            <Feather name="edit-2" size={14} color={theme.colors.brandDark} />
          </Pressable>
          <Pressable onPress={onDelete} style={[styles.actionButton, styles.deleteButton]} hitSlop={6} accessibilityRole="button" accessibilityLabel={`Remove ${food.name}`}>
            <Feather name="trash-2" size={14} color={theme.colors.error} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  thumb: {
    borderRadius: theme.radius.md,
  },
  textCol: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  portion: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
    flexShrink: 1,
  },
  dot: {
    color: theme.colors.textMuted,
    fontSize: 10,
  },
  kcal: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
    flexShrink: 0,
  },
  confidenceCol: {
    alignItems: 'flex-end',
  },
  confidenceValue: {
    ...theme.text.cardTitle,
    fontSize: theme.fontSize.base,
  },
  confidenceLabel: {
    ...theme.text.caption,
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
  },
  actionButton: {
    width: 28,
    height: 28,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: theme.colors.brandTint,
  },
  deleteButton: {
    backgroundColor: theme.colors.errorBg,
  },
});
