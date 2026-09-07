import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { formatShortDate } from '@/utils/nutrition';
import { kgToLb, lbToKg } from '@/utils/units';
import { PACE_OPTIONS } from '@/constants/goalOptions';
import { theme } from '@/constants/theme';
import type { GoalType, UnitSystem } from '@/types/models';

interface TargetsSectionProps {
  goalType: GoalType;
  /** Canonical kg value as a string — this component handles kg<->lb display conversion internally. */
  targetWeightKg: string;
  onTargetWeightChange: (value: string) => void;
  weeklyPaceKg: number;
  onWeeklyPaceChange: (value: number) => void;
  dailyCalorieTarget: number;
  goalDate?: Date;
  preferredUnit: UnitSystem;
}

/**
 * Target Weight + Weekly Pace + Daily Calorie Target cards — shared by
 * onboarding's Target Setup step and the Goals settings screen so the
 * layout/copy/math presentation only exists once. Callers own the actual
 * state and the calorie/date calculations (via utils/nutrition.ts) and
 * just pass the results in; this component owns converting the target
 * weight field for display in the user's preferred unit (previously this
 * field always showed a bare number with no unit label or conversion at
 * all, regardless of preferredUnit).
 */
export function TargetsSection({
  goalType,
  targetWeightKg,
  onTargetWeightChange,
  weeklyPaceKg,
  onWeeklyPaceChange,
  dailyCalorieTarget,
  goalDate,
  preferredUnit,
}: TargetsSectionProps) {
  const isPaceRelevant = goalType === 'lose_weight' || goalType === 'build_muscle';
  const isGaining = goalType === 'build_muscle';

  const [weightDisplayText, setWeightDisplayText] = useState(() => {
    const kg = Number(targetWeightKg) || 0;
    if (kg <= 0) return '';
    const value = preferredUnit === 'imperial' ? kgToLb(kg) : kg;
    return value.toFixed(1);
  });

  // Re-derive the displayed text when the unit preference itself changes
  // (e.g. profile loads after this mounted, or the user changes units
  // elsewhere and returns) — but not on every targetWeightKg change, so
  // this doesn't fight the user while they're actively typing.
  useEffect(() => {
    const kg = Number(targetWeightKg) || 0;
    if (kg > 0) {
      const value = preferredUnit === 'imperial' ? kgToLb(kg) : kg;
      setWeightDisplayText(value.toFixed(1));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preferredUnit]);

  function handleWeightTextChange(text: string) {
    setWeightDisplayText(text);
    const numeric = Number(text);
    if (!Number.isNaN(numeric) && numeric > 0) {
      const kg = preferredUnit === 'imperial' ? lbToKg(numeric) : numeric;
      onTargetWeightChange(String(Math.round(kg * 10) / 10));
    }
  }

  return (
    <>
      {isPaceRelevant && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>1. Target Weight</Text>
          <Text style={styles.cardDescription}>Set the weight you want to achieve</Text>

          <Input
            label="Target Weight"
            icon="target"
            value={weightDisplayText}
            onChangeText={handleWeightTextChange}
            keyboardType="decimal-pad"
            rightAdornment={<Text style={styles.unitSuffix}>{preferredUnit === 'imperial' ? 'lb' : 'kg'}</Text>}
          />

          {goalDate && (
            <View style={styles.tip}>
              <Feather name="feather" size={14} color={theme.colors.brandDark} />
              <Text style={styles.tipText}>
                You'll reach your goal around <Text style={styles.tipAccent}>{formatShortDate(goalDate)}</Text>
              </Text>
            </View>
          )}
        </Card>
      )}

      {isPaceRelevant && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>{isGaining ? '2. Weekly Weight Gain Target' : '2. Weekly Weight Loss Target'}</Text>
          <Text style={styles.cardDescription}>
            Choose how much weight you want to {isGaining ? 'gain' : 'lose'} per week
          </Text>

          <View style={styles.paceTrack}>
            {PACE_OPTIONS.map((pace) => {
              const selected = pace === weeklyPaceKg;
              return (
                <Pressable key={pace} style={styles.paceStop} onPress={() => onWeeklyPaceChange(pace)}>
                  <View style={[styles.paceDot, selected && styles.paceDotSelected]} />
                  <Text style={[styles.paceValue, selected && styles.paceValueSelected]}>{pace} kg</Text>
                  <Text style={styles.paceLabel}>per week</Text>
                </Pressable>
              );
            })}
          </View>

          <View style={styles.tip}>
            <Feather name="bar-chart-2" size={14} color={theme.colors.brandDark} />
            <Text style={styles.tipText}>
              {isGaining ? 'Gaining' : 'Losing'} <Text style={styles.tipAccent}>{weeklyPaceKg} kg</Text> per week is
              recommended for steady and sustainable results.
            </Text>
          </View>
        </Card>
      )}

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>{isPaceRelevant ? '3.' : '1.'} Daily Calorie Target</Text>
        <Text style={styles.cardDescription}>Set your daily calorie target to achieve your goal</Text>

        <View style={styles.calorieRow}>
          <View style={styles.calorieIconWrap}>
            <Feather name="zap" size={16} color={theme.colors.brandDark} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.calorieLabel}>Daily Calorie Target</Text>
            <Text style={styles.calorieValue}>{dailyCalorieTarget.toLocaleString()} kcal / day</Text>
          </View>
          <View style={styles.recommendedBadge}>
            <Text style={styles.recommendedText}>Recommended</Text>
          </View>
        </View>

        <View style={styles.tip}>
          <Feather name="zap" size={14} color={theme.colors.brandDark} />
          <Text style={styles.tipText}>This may adjust as you log more meals and activities.</Text>
        </View>
      </Card>
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  cardTitle: {
    ...theme.text.cardTitle,
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
  },
  cardDescription: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
    marginTop: -theme.spacing.xxs,
  },
  unitSuffix: {
    ...theme.text.label,
    color: theme.colors.textMuted,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.brandTint,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
  },
  tipText: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  tipAccent: {
    color: theme.colors.brandDark,
    fontFamily: theme.fontFamily.sansSemiBold,
  },
  paceTrack: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  paceStop: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  paceDot: {
    width: 16,
    height: 16,
    borderRadius: theme.radius.pill,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  paceDotSelected: {
    borderColor: theme.colors.brandPrimary,
    backgroundColor: theme.colors.brandPrimary,
  },
  paceValue: {
    ...theme.text.caption,
    fontFamily: theme.fontFamily.sansSemiBold,
    color: theme.colors.textPrimary,
  },
  paceValueSelected: {
    color: theme.colors.brandDark,
  },
  paceLabel: {
    ...theme.text.caption,
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  calorieRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  calorieIconWrap: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  calorieLabel: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  calorieValue: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  recommendedBadge: {
    backgroundColor: theme.colors.brandTint,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
  },
  recommendedText: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.brandDark,
    fontFamily: theme.fontFamily.sansSemiBold,
  },
});
