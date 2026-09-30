import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card } from '@/components/ui/Card';
import { ProLockedCard } from '@/components/ui/ProLockedCard';
import { kgToLb } from '@/utils/units';
import type { AdvancedAnalytics } from '@/utils/advancedAnalytics';
import { theme } from '@/constants/theme';
import type { MealType, UnitSystem } from '@/types/models';

interface AdvancedAnalyticsSectionProps {
  isPro: boolean;
  analytics: AdvancedAnalytics;
  calorieGoal: number;
  preferredUnit: UnitSystem;
}

const MEAL_TYPE_LABEL: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
};

/** CalHow Pro "Advanced Progress Analytics" cards for the Progress tab — see utils/advancedAnalytics.ts for the math. */
export function AdvancedAnalyticsSection({ isPro, analytics, calorieGoal, preferredUnit }: AdvancedAnalyticsSectionProps) {
  if (!isPro) {
    return (
      <ProLockedCard
        icon="bar-chart-2"
        title="Advanced Analytics"
        description="See how many days you hit your calorie goal, weekday vs weekend eating, which meals carry the most calories, your most-logged foods and how your weight is trending."
      />
    );
  }

  if (analytics.loggedDays === 0) {
    return (
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Advanced Analytics</Text>
        <Text style={styles.muted}>Log a few meals in this period to see your detailed analytics.</Text>
      </Card>
    );
  }

  const { loggedDays, onTargetDays, overDays, underDays } = analytics;
  const onTargetPercent = Math.round((onTargetDays / loggedDays) * 100);
  const weight = analytics.weightChange;
  const toDisplay = (kg: number) => (preferredUnit === 'imperial' ? kgToLb(kg) : kg);
  const weightUnit = preferredUnit === 'imperial' ? 'lb' : 'kg';

  return (
    <>
      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Goal Consistency</Text>
        <Text style={styles.muted}>
          Based on the {loggedDays} day{loggedDays === 1 ? '' : 's'} you logged. On target means within 10% of your{' '}
          {calorieGoal.toLocaleString()} kcal goal.
        </Text>
        <View style={styles.statsRow}>
          <Stat value={`${onTargetPercent}%`} label="Days on target" accent />
          <Stat value={String(overDays)} label="Days over" />
          <Stat value={String(underDays)} label="Days under" />
        </View>
        <View style={styles.statsRow}>
          <Stat value={analytics.avgCaloriesLoggedDays.toLocaleString()} label="Avg kcal (logged days)" />
          <Stat value={analytics.weekdayAvg != null ? analytics.weekdayAvg.toLocaleString() : '—'} label="Weekday avg" />
          <Stat value={analytics.weekendAvg != null ? analytics.weekendAvg.toLocaleString() : '—'} label="Weekend avg" />
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Calories by Meal</Text>
        {analytics.mealTypeShare.map((entry) => (
          <View key={entry.mealType} style={styles.barRow}>
            <Text style={styles.barLabel}>{MEAL_TYPE_LABEL[entry.mealType]}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${entry.percent}%` }]} />
            </View>
            <Text style={styles.barValue}>{entry.percent}%</Text>
          </View>
        ))}
      </Card>

      {analytics.topFoods.length > 0 && (
        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Most Logged Foods</Text>
          {analytics.topFoods.map((food, index) => (
            <View key={food.name} style={styles.foodRow}>
              <Text style={styles.foodRank}>{index + 1}</Text>
              <Text style={styles.foodName} numberOfLines={1}>
                {food.name}
              </Text>
              <Text style={styles.foodMeta}>
                {food.count}× · {Math.round(food.calories / food.count).toLocaleString()} kcal avg
              </Text>
            </View>
          ))}
        </Card>
      )}

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Weight Trend</Text>
        {weight ? (
          <View style={styles.statsRow}>
            <Stat value={`${toDisplay(weight.startKg).toFixed(1)} ${weightUnit}`} label="Start" />
            <Stat value={`${toDisplay(weight.endKg).toFixed(1)} ${weightUnit}`} label="Latest" />
            <Stat
              value={`${weight.changeKg > 0 ? '+' : ''}${toDisplay(weight.changeKg).toFixed(1)} ${weightUnit}`}
              label="Change"
              accent
            />
          </View>
        ) : (
          <Text style={styles.muted}>Log your weight at least twice in this period to see your trend.</Text>
        )}
      </Card>
    </>
  );
}

function Stat({ value, label, accent }: { value: string; label: string; accent?: boolean }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, accent && styles.statValueAccent]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  cardTitle: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  muted: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    backgroundColor: theme.colors.brandTint,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xs,
  },
  statValue: {
    fontFamily: theme.fontFamily.sansBold,
    fontSize: theme.fontSize.base,
    color: theme.colors.textPrimary,
  },
  statValueAccent: {
    color: theme.colors.brandDark,
  },
  statLabel: {
    ...theme.text.caption,
    fontSize: 10,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  barLabel: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
    width: 70,
  },
  barTrack: {
    flex: 1,
    height: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.border,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brandPrimary,
  },
  barValue: {
    ...theme.text.caption,
    fontFamily: theme.fontFamily.sansSemiBold,
    color: theme.colors.textPrimary,
    width: 36,
    textAlign: 'right',
  },
  foodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  foodRank: {
    ...theme.text.caption,
    fontFamily: theme.fontFamily.sansBold,
    color: theme.colors.brandDark,
    width: 16,
  },
  foodName: {
    ...theme.text.body,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  foodMeta: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
});
