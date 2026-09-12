import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProgressRing } from '@/components/ui/ProgressRing';
import { LineChartMini } from '@/components/charts/LineChartMini';
import { DonutChart } from '@/components/charts/DonutChart';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMealHistory } from '@/hooks/useMealHistory';
import {
  bucketCaloriesForChart,
  computeLoggingHabits,
  computeMacroBalance,
  computeNutritionOverview,
  periodToDays,
  type ProgressPeriod,
} from '@/utils/progressStats';
import { theme } from '@/constants/theme';

const PERIODS: { label: string; value: ProgressPeriod }[] = [
  { label: 'Week', value: 'week' },
  { label: 'Month', value: 'month' },
  { label: '3 Months', value: '3months' },
  { label: 'Year', value: 'year' },
];

export default function ProgressScreen() {
  const { profile } = useUserProfile();
  const { meals } = useMealHistory();
  const [period, setPeriod] = useState<ProgressPeriod>('week');

  const goals = profile?.goals?.macroTargets;
  const overview = useMemo(
    () =>
      computeNutritionOverview(meals, period, {
        dailyCalorieTarget: profile?.goals?.dailyCalorieTarget,
        proteinG: goals?.proteinG,
        carbsG: goals?.carbsG,
        fatsG: goals?.fatsG,
        fiberG: goals?.fiberG,
      }),
    [meals, period, profile, goals],
  );

  const chartBuckets = useMemo(() => bucketCaloriesForChart(meals, period), [meals, period]);
  const macroBalance = useMemo(() => computeMacroBalance(meals, period), [meals, period]);
  const habits = useMemo(() => computeLoggingHabits(meals, period), [meals, period]);

  const avgKcalPerDay = overview.calories.value;
  const wowChange = useMemo(() => {
    const thisWeek = bucketCaloriesForChart(meals, 'week');
    const thisWeekAvg = thisWeek.reduce((s, b) => s + b.value, 0) / 7;
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const lastWeekMeals = meals.filter((m) => m.loggedAt >= twoWeeksAgo && m.loggedAt < oneWeekAgo);
    const lastWeekAvg = lastWeekMeals.reduce((s, m) => s + m.calories, 0) / 7;
    if (lastWeekAvg <= 0) return undefined;
    return Math.round(((thisWeekAvg - lastWeekAvg) / lastWeekAvg) * 100);
  }, [meals]);

  const [chartWidth, setChartWidth] = useState(0);
  const onChartLayout = useCallback((e: LayoutChangeEvent) => setChartWidth(e.nativeEvent.layout.width), []);

  const macroTotal = macroBalance.proteinG * 4 + macroBalance.carbsG * 4 + macroBalance.fatsG * 9;
  const firstName = profile?.fullName?.split(' ')[0] || 'there';
  const periodDays = periodToDays(period);
  const rangeLabel = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - periodDays);
    const fmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
    return `${fmt.format(start)} \u2013 ${fmt.format(end)}`;
  }, [periodDays]);

  return (
    <ScreenContainer>
      <AppHeader left="menu" onLeftPress={() => router.push('/(tabs)/profile')} showProfile avatarUrl={profile?.photoUrl} />

      <Text style={styles.heading}>Your progress</Text>
      <Text style={styles.subtitle}>Track your journey, celebrate wins and build healthier habits every day.</Text>

      <Button
        label="Log Weight"
        icon="plus"
        variant="outline"
        onPress={() => router.push('/add-weight')}
        style={styles.addWeightButton}
      />

      <View style={styles.periodRow}>
        {PERIODS.map((p) => {
          const active = period === p.value;
          return (
            <Pressable key={p.value} onPress={() => setPeriod(p.value)} style={[styles.periodPill, active && styles.periodPillActive]}>
              <Text style={[styles.periodText, active && styles.periodTextActive]}>{p.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <Card style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Nutrition Overview</Text>
          <Text style={styles.rangeLabel}>{rangeLabel}</Text>
        </View>
        <View style={styles.ringsRow}>
          <OverviewRing label="Calories" value={overview.calories.value} goal={overview.calories.goal} unit="" color={theme.colors.brandPrimary} />
          <OverviewRing label="Carbs" value={overview.carbs.value} goal={overview.carbs.goal} unit="g" color={theme.colors.nutrition.carbs} />
          <OverviewRing label="Fats" value={overview.fats.value} goal={overview.fats.goal} unit="g" color={theme.colors.nutrition.fats} />
          <OverviewRing label="Protein" value={overview.protein.value} goal={overview.protein.goal} unit="g" color={theme.colors.nutrition.protein} />
          <OverviewRing label="Fiber" value={overview.fiber.value} goal={overview.fiber.goal} unit="g" color={theme.colors.nutrition.fiber} />
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Calorie Trend</Text>
        <Text style={styles.chartSubLabel}>(kcal/day)</Text>
        <Text style={styles.chartBigValue}>{avgKcalPerDay}</Text>
        {wowChange != null && (
          <View style={styles.wowBadge}>
            <Feather name={wowChange >= 0 ? 'arrow-up' : 'arrow-down'} size={10} color={theme.colors.brandDark} />
            <Text style={styles.wowText}>{Math.abs(wowChange)}% vs last week</Text>
          </View>
        )}
        <View onLayout={onChartLayout}>
          {chartWidth > 0 && <LineChartMini values={chartBuckets.map((b) => b.value)} width={chartWidth} height={120} />}
        </View>
        <View style={styles.chartLabelsRow}>
          {chartBuckets.map((b, i) => (
            <Text key={i} style={styles.chartLabelText}>
              {b.label}
            </Text>
          ))}
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Macronutrient Balance</Text>
        <Text style={styles.chartSubLabel}>(Average)</Text>
        <View style={styles.donutWrap}>
          <DonutChart
            size={160}
            strokeWidth={20}
            segments={
              macroTotal > 0
                ? [
                    { value: macroBalance.proteinG * 4, color: theme.colors.nutrition.protein },
                    { value: macroBalance.fatsG * 9, color: theme.colors.nutrition.fats },
                    { value: macroBalance.carbsG * 4, color: theme.colors.nutrition.carbs },
                  ]
                : [{ value: 1, color: theme.palette.ink100 }]
            }
          />
        </View>
        <View style={styles.donutLegendRow}>
          <LegendItem color={theme.colors.nutrition.protein} label="Protein" value={`${macroBalance.proteinG}g`} />
          <LegendItem color={theme.colors.nutrition.fats} label="Fats" value={`${macroBalance.fatsG}g`} />
          <LegendItem color={theme.colors.nutrition.carbs} label="Carbs" value={`${macroBalance.carbsG}g`} />
        </View>
      </Card>

      <Card style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Logging Habits</Text>
          <Text style={styles.rangeLabel}>{PERIODS.find((p) => p.value === period)?.label}</Text>
        </View>
        <View style={styles.habitsRow}>
          <HabitTile icon="camera" value={`${habits.daysLogged}/${habits.totalDays}`} label="Days logged" />
          <HabitTile icon="feather" value={`${habits.highFiberDays}/${habits.totalDays}`} label="High fiber days" />
        </View>
        <Text style={styles.habitsNote}>More habit tracking (water, sleep, activity) is coming in a future update.</Text>
      </Card>

      {profile && profile.streakDays > 0 && (
        <Card style={styles.streakCard}>
          <View style={styles.streakIcon}>
            <Feather name="award" size={20} color={theme.colors.warning} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.streakTitle}>Great job, {firstName}! 🎉</Text>
            <Text style={styles.streakSubtitle}>You're making consistent progress. Keep it up!</Text>
          </View>
          <View style={styles.streakBadge}>
            <Text style={styles.streakNumber}>{profile.streakDays}</Text>
            <Text style={styles.streakLabel}>Day streak</Text>
          </View>
        </Card>
      )}
    </ScreenContainer>
  );
}

function OverviewRing({ label, value, goal, unit, color }: { label: string; value: number; goal: number; unit: string; color: string }) {
  const percent = goal > 0 ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  return (
    <View style={styles.overviewRingCol}>
      <ProgressRing progress={percent} size={64} strokeWidth={6} color={color}>
        <Text style={styles.ringSmallValue}>
          {value}
          {unit}
        </Text>
      </ProgressRing>
      <Text style={styles.overviewLabel}>{label}</Text>
      <Text style={[styles.overviewGoalPercent, { color }]}>{percent}% of goal</Text>
    </View>
  );
}

function LegendItem({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
      <Text style={styles.legendValue}>{value}</Text>
    </View>
  );
}

function HabitTile({ icon, value, label }: { icon: keyof typeof Feather.glyphMap; value: string; label: string }) {
  return (
    <View style={styles.habitTile}>
      <View style={styles.habitIconWrap}>
        <Feather name={icon} size={16} color={theme.colors.brandDark} />
      </View>
      <Text style={styles.habitValue}>{value}</Text>
      <Text style={styles.habitLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...theme.text.screenHeading,
    fontSize: theme.fontSize['2xl'],
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.md,
  },
  subtitle: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xxs,
  },
  addWeightButton: {
    marginTop: theme.spacing.md,
  },
  periodRow: {
    flexDirection: 'row',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.lg,
  },
  periodPill: {
    flex: 1,
    borderRadius: theme.radius.pill,
    paddingVertical: theme.spacing.xs,
    alignItems: 'center',
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  periodPillActive: {
    backgroundColor: theme.colors.brandPrimary,
    borderColor: theme.colors.brandPrimary,
  },
  periodText: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  periodTextActive: {
    color: theme.colors.textInverse,
    fontFamily: theme.fontFamily.sansSemiBold,
  },
  card: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  rangeLabel: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  ringsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  overviewRingCol: {
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  ringSmallValue: {
    fontFamily: theme.fontFamily.sansBold,
    fontSize: 11,
    color: theme.colors.textPrimary,
  },
  overviewLabel: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  overviewGoalPercent: {
    ...theme.text.caption,
    fontSize: 10,
    fontFamily: theme.fontFamily.sansSemiBold,
  },
  chartSubLabel: {
    ...theme.text.caption,
    fontSize: 10,
    color: theme.colors.textMuted,
  },
  chartBigValue: {
    fontFamily: theme.fontFamily.serifBold,
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
  },
  wowBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: theme.spacing.xxs,
  },
  wowText: {
    ...theme.text.caption,
    fontSize: 10,
    color: theme.colors.brandDark,
  },
  chartLabelsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.xs,
  },
  chartLabelText: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  donutWrap: {
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  donutLegendRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 9,
    height: 9,
    borderRadius: theme.radius.pill,
  },
  legendLabel: {
    ...theme.text.caption,
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  legendValue: {
    ...theme.text.caption,
    fontSize: 11,
    fontFamily: theme.fontFamily.sansSemiBold,
    color: theme.colors.textPrimary,
  },
  habitsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  habitTile: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    backgroundColor: theme.colors.brandTint,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.sm,
  },
  habitIconWrap: {
    width: 32,
    height: 32,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  habitValue: {
    fontFamily: theme.fontFamily.sansBold,
    fontSize: theme.fontSize.base,
    color: theme.colors.textPrimary,
  },
  habitLabel: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  habitsNote: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  streakCard: {
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  streakIcon: {
    width: 44,
    height: 44,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.warningBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  streakTitle: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  streakSubtitle: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  streakBadge: {
    alignItems: 'center',
  },
  streakNumber: {
    fontFamily: theme.fontFamily.serifBold,
    fontSize: theme.fontSize.xl,
    color: theme.colors.warning,
  },
  streakLabel: {
    ...theme.text.caption,
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
});
