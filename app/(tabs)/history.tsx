import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Card } from '@/components/ui/Card';
import { WeekStrip } from '@/components/meal/WeekStrip';
import { MealListItem } from '@/components/meal/MealListItem';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMealHistory } from '@/hooks/useMealHistory';
import { groupMealsByDay, calcWeeklyAverage } from '@/utils/mealHistory';
import { theme } from '@/constants/theme';
import type { Meal, MealType } from '@/types/models';

const FILTERS: { label: string; value: MealType | 'all' }[] = [
  { label: 'All Meals', value: 'all' },
  { label: 'Breakfast', value: 'breakfast' },
  { label: 'Lunch', value: 'lunch' },
  { label: 'Dinner', value: 'dinner' },
  { label: 'Snacks', value: 'snack' },
];

const TIME_ICON: Record<MealType, keyof typeof Feather.glyphMap> = {
  breakfast: 'sunrise',
  lunch: 'sun',
  dinner: 'sunset',
  snack: 'moon',
};

function dateKeyOf(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

function labelForDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(date);
}

export default function HistoryScreen() {
  const { profile } = useUserProfile();
  const { meals, loading } = useMealHistory();
  const [viewDate, setViewDate] = useState(new Date());
  const [dateFilter, setDateFilter] = useState<Date | null>(null);
  const [mealTypeFilter, setMealTypeFilter] = useState<MealType | 'all'>('all');

  const filteredMeals = useMemo(
    () => (mealTypeFilter === 'all' ? meals : meals.filter((m) => m.mealType === mealTypeFilter)),
    [meals, mealTypeFilter],
  );

  const markedDateKeys = useMemo(() => new Set(meals.map((m) => dateKeyOf(m.loggedAt))), [meals]);

  const groups = useMemo(() => {
    const all = groupMealsByDay(filteredMeals);
    if (!dateFilter) return all;
    const key = dateKeyOf(dateFilter);
    const match = all.find((g) => g.dateKey === key);
    return match ? [match] : [{ label: labelForDate(dateFilter), dateKey: key, meals: [] as Meal[] }];
  }, [filteredMeals, dateFilter]);

  const weeklyAverage = useMemo(() => calcWeeklyAverage(meals), [meals]);

  const goalCalories = profile?.goals?.dailyCalorieTarget;

  function handleSelectDate(date: Date) {
    setViewDate(date);
    setDateFilter(date);
  }

  return (
    <ScreenContainer>
      <AppHeader left="menu" onLeftPress={() => router.push('/(tabs)/profile')} showProfile avatarUrl={profile?.photoUrl} />

      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>Your meal history</Text>
          <Text style={styles.subtitle}>View your past meals, check your nutrition and stay on track.</Text>
        </View>
      </View>

      <View style={styles.calendarWrap}>
        <WeekStrip selectedDate={viewDate} onSelectDate={handleSelectDate} markedDateKeys={markedDateKeys} />
      </View>

      {dateFilter && (
        <Pressable style={styles.clearFilterChip} onPress={() => setDateFilter(null)}>
          <Feather name="x" size={12} color={theme.colors.brandDark} />
          <Text style={styles.clearFilterText}>Showing {groups[0]?.label} only — tap to show all</Text>
        </Pressable>
      )}

      <View style={styles.filterRow}>
        {FILTERS.map((filter) => {
          const active = mealTypeFilter === filter.value;
          return (
            <Pressable
              key={filter.value}
              onPress={() => setMealTypeFilter(filter.value)}
              style={[styles.filterPill, active && styles.filterPillActive]}
            >
              <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>{filter.label}</Text>
            </Pressable>
          );
        })}
      </View>

      {loading && (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={theme.colors.brandPrimary} />
        </View>
      )}

      {!loading && groups.every((g) => g.meals.length === 0) && (
        <Card tinted style={styles.emptyState}>
          <Feather name="camera" size={18} color={theme.colors.brandDark} />
          <Text style={styles.emptyStateText}>No meals found for this selection.</Text>
        </Card>
      )}

      {groups.map(
        (group) =>
          group.meals.length > 0 && (
            <View key={group.dateKey} style={styles.dayGroup}>
              <Text style={styles.dayGroupLabel}>{group.label}</Text>
              {group.meals.map((meal) => {
                const percent = goalCalories ? Math.min(100, Math.round((meal.calories / goalCalories) * 100)) : undefined;
                return (
                  <MealListItem
                    key={meal.id}
                    variant="detailed"
                    imageUri={meal.imageUrl}
                    title={meal.foods[0]?.name ?? 'Meal'}
                    time={new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(meal.loggedAt)}
                    timeIcon={TIME_ICON[meal.mealType]}
                    kcal={meal.calories}
                    macros={{ protein: Math.round(meal.protein), carbs: Math.round(meal.carbs), fats: Math.round(meal.fats) }}
                    progressPercent={percent}
                    onPress={() => router.push(`/meal/${meal.id}`)}
                  />
                );
              })}
            </View>
          ),
      )}

      <Card style={styles.weeklyCard}>
        <View style={styles.weeklyHeader}>
          <Feather name="bar-chart-2" size={16} color={theme.colors.brandDark} />
          <Text style={styles.weeklyTitle}>Weekly Average</Text>
        </View>
        <View style={styles.weeklyRow}>
          <WeeklyStat value={`${weeklyAverage.kcalPerDay}`} label="kcal/day" />
          <WeeklyStat value={`${weeklyAverage.proteinPerDay} g`} label="Protein" color={theme.colors.nutrition.protein} />
          <WeeklyStat value={`${weeklyAverage.carbsPerDay} g`} label="Carbs" color={theme.colors.nutrition.carbs} />
          <WeeklyStat value={`${weeklyAverage.fatsPerDay} g`} label="Fats" color={theme.colors.nutrition.fats} />
        </View>
      </Card>
    </ScreenContainer>
  );
}

function WeeklyStat({ value, label, color }: { value: string; label: string; color?: string }) {
  return (
    <View style={styles.weeklyStat}>
      <Text style={styles.weeklyValue}>{value}</Text>
      <View style={styles.weeklyLabelRow}>
        {color && <View style={[styles.weeklyDot, { backgroundColor: color }]} />}
        <Text style={styles.weeklyLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    marginTop: theme.spacing.md,
  },
  heading: {
    ...theme.text.screenHeading,
    fontSize: theme.fontSize['2xl'],
    color: theme.colors.textPrimary,
  },
  subtitle: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xxs,
  },
  calendarWrap: {
    marginTop: theme.spacing.lg,
  },
  clearFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.brandTint,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    marginTop: theme.spacing.sm,
  },
  clearFilterText: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.brandDark,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.md,
  },
  filterPill: {
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  filterPillActive: {
    backgroundColor: theme.colors.brandPrimary,
    borderColor: theme.colors.brandPrimary,
  },
  filterPillText: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  filterPillTextActive: {
    color: theme.colors.textInverse,
    fontFamily: theme.fontFamily.sansSemiBold,
  },
  loadingWrap: {
    paddingVertical: theme.spacing['2xl'],
    alignItems: 'center',
  },
  emptyState: {
    marginTop: theme.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  emptyStateText: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  dayGroup: {
    marginTop: theme.spacing.lg,
  },
  dayGroupLabel: {
    ...theme.text.cardTitle,
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
    marginBottom: theme.spacing.xs,
  },
  weeklyCard: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  weeklyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  weeklyTitle: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  weeklyRow: {
    flexDirection: 'row',
  },
  weeklyStat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  weeklyValue: {
    fontFamily: theme.fontFamily.sansBold,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
  },
  weeklyLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  weeklyDot: {
    width: 6,
    height: 6,
    borderRadius: theme.radius.pill,
  },
  weeklyLabel: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
});
