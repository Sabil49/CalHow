import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { theme } from '@/constants/theme';

interface MealTotalsCardProps {
  calories: number;
  carbs: number;
  protein: number;
  fats: number;
  fiber?: number;
  /** Daily calorie goal to show progress against. */
  calorieGoal: number;
}

/**
 * "Total Calories" card: ring + macro breakdown legend. Shared by the scan
 * Result screen (right after analysis) and Meal Details (viewing a saved
 * meal later) so the math and layout live in exactly one place.
 */
export function MealTotalsCard({ calories, carbs, protein, fats, fiber, calorieGoal }: MealTotalsCardProps) {
  const percentOfGoal = calorieGoal > 0 ? Math.min(100, Math.round((calories / calorieGoal) * 100)) : 0;

  const macroShares = useMemo(() => {
    const totalMacroCalories = protein * 4 + carbs * 4 + fats * 9;
    if (totalMacroCalories <= 0) return { carbs: 0, protein: 0, fats: 0, fiber: 0 };
    return {
      carbs: Math.round(((carbs * 4) / totalMacroCalories) * 100),
      protein: Math.round(((protein * 4) / totalMacroCalories) * 100),
      fats: Math.round(((fats * 9) / totalMacroCalories) * 100),
      fiber: fiber ? Math.round((fiber / 30) * 100) : 0,
    };
  }, [carbs, protein, fats, fiber]);

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Total Calories</Text>
          <Text style={styles.value}>{Math.round(calories)} kcal</Text>
          <Text style={styles.goal}>{percentOfGoal}% of daily goal</Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${percentOfGoal}%` }]} />
          </View>
        </View>

        <ProgressRing progress={percentOfGoal} size={90} strokeWidth={8}>
          <Text style={styles.ringValue}>{Math.round(calories)}</Text>
          <Text style={styles.ringLabel}>kcal</Text>
        </ProgressRing>
      </View>

      <View style={styles.legend}>
        <MacroLegendRow color={theme.colors.nutrition.carbs} label="Carbs" percent={macroShares.carbs} grams={carbs} />
        <MacroLegendRow color={theme.colors.nutrition.protein} label="Protein" percent={macroShares.protein} grams={protein} />
        <MacroLegendRow color={theme.colors.nutrition.fats} label="Fats" percent={macroShares.fats} grams={fats} />
        {fiber != null && <MacroLegendRow color={theme.colors.nutrition.fiber} label="Fiber" percent={macroShares.fiber} grams={fiber} />}
      </View>
    </Card>
  );
}

function MacroLegendRow({ color, label, percent, grams }: { color: string; label: string; percent: number; grams: number }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>
        {label} <Text style={{ color }}>{percent}%</Text>
      </Text>
      <Text style={styles.legendGrams}>{Math.round(grams)} g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  label: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  value: {
    fontFamily: theme.fontFamily.serifBold,
    fontSize: theme.fontSize['2xl'],
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  goal: {
    ...theme.text.caption,
    color: theme.colors.success,
    marginTop: 2,
  },
  progressTrack: {
    height: 6,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.border,
    marginTop: theme.spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brandPrimary,
  },
  ringValue: {
    fontFamily: theme.fontFamily.serifBold,
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
  },
  ringLabel: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  legend: {
    gap: theme.spacing.xs,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: theme.radius.pill,
  },
  legendLabel: {
    ...theme.text.caption,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  legendGrams: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
});
