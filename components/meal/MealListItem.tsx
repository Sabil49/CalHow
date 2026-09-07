import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import { MealThumbnail } from '@/components/ui/MealThumbnail';
import { ProgressRing } from '@/components/ui/ProgressRing';

interface MealListItemProps {
  imageUri?: string;
  title: string;
  onPress?: () => void;
  /** 'compact': Home's "Today's meals" row (subtitle + kcal + trailing accessory). 'detailed': History's row (time, macros, progress ring). */
  variant?: 'compact' | 'detailed';
  // compact variant
  subtitle?: string;
  kcal?: number;
  rightAccessory?: React.ReactNode;
  // detailed variant
  time?: string;
  timeIcon?: keyof typeof Feather.glyphMap;
  macros?: { protein: number; carbs: number; fats: number };
  progressPercent?: number;
  bookmarked?: boolean;
}

export function MealListItem({
  imageUri,
  title,
  onPress,
  variant = 'compact',
  subtitle,
  kcal,
  rightAccessory,
  time,
  timeIcon = 'sun',
  macros,
  progressPercent,
  bookmarked,
}: MealListItemProps) {
  if (variant === 'detailed') {
    return (
      <Pressable onPress={onPress} style={styles.detailedRow}>
        <View style={styles.timeCol}>
          <Feather name={timeIcon} size={14} color={theme.colors.warning} />
          <Text style={styles.timeText}>{time}</Text>
        </View>

        <MealThumbnail imageUri={imageUri} size={56} style={styles.detailedThumb} />

        <View style={styles.detailedTextCol}>
          <View style={styles.titleRow}>
            <Text style={styles.detailedTitle} numberOfLines={1}>
              {title}
            </Text>
            {bookmarked && <Feather name="bookmark" size={13} color={theme.colors.brandPrimary} />}
          </View>
          {kcal != null && <Text style={styles.kcalText}>{kcal} kcal</Text>}
          {macros && (
            <Text style={styles.macrosText}>
              <Text style={{ color: theme.colors.nutrition.protein }}>P {macros.protein}g</Text>
              {'  •  '}
              <Text style={{ color: theme.colors.nutrition.carbs }}>C {macros.carbs}g</Text>
              {'  •  '}
              <Text style={{ color: theme.colors.nutrition.fats }}>F {macros.fats}g</Text>
            </Text>
          )}
        </View>

        {progressPercent != null && (
          <ProgressRing progress={progressPercent} size={44} strokeWidth={4}>
            <Text style={styles.ringText}>{Math.round(progressPercent)}%</Text>
          </ProgressRing>
        )}
        <Feather name="chevron-right" size={16} color={theme.colors.textMuted} />
      </Pressable>
    );
  }

  return (
    <Pressable onPress={onPress} style={styles.compactRow}>
      <MealThumbnail imageUri={imageUri} size={56} style={styles.compactThumb} />
      <View style={styles.compactTextCol}>
        <Text style={styles.compactTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle && (
          <Text style={styles.compactSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
        {kcal != null && (
          <View style={styles.kcalPill}>
            <Text style={styles.kcalPillText}>{kcal} kcal</Text>
          </View>
        )}
      </View>
      {rightAccessory}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  compactThumb: {
    borderRadius: theme.radius.md,
  },
  compactTextCol: {
    flex: 1,
    gap: 3,
  },
  compactTitle: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  compactSubtitle: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  kcalPill: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.brandTint,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    marginTop: 2,
  },
  kcalPillText: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.brandDark,
    fontFamily: theme.fontFamily.sansSemiBold,
  },
  detailedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  timeCol: {
    width: 46,
    alignItems: 'center',
    gap: 2,
  },
  timeText: {
    ...theme.text.caption,
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  detailedThumb: {
    borderRadius: theme.radius.md,
  },
  detailedTextCol: {
    flex: 1,
    gap: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailedTitle: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
    flexShrink: 1,
  },
  kcalText: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  macrosText: {
    ...theme.text.caption,
    fontSize: 11,
  },
  ringText: {
    fontFamily: theme.fontFamily.sansBold,
    fontSize: 10,
    color: theme.colors.textPrimary,
  },
});
