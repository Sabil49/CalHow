import type { Meal, MealType, WeightLog } from '@/types/models';
import { periodToDays, type ProgressPeriod } from './progressStats';

/**
 * CalHow Pro "Advanced Progress Analytics" — pure calculations behind the
 * extra Progress-screen cards. Unlike the free overview (which averages
 * over every day in the period, logged or not), everything here is based
 * on days the user actually logged food, so a skipped day doesn't read as
 * a 0-calorie day.
 */

/** Local calendar day, e.g. "2026-09-30" — local, not UTC, so late-evening meals count toward the right day. */
export function localDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function periodStart(period: ProgressPeriod, now: Date): Date {
  const start = new Date(now);
  start.setDate(start.getDate() - periodToDays(period));
  start.setHours(0, 0, 0, 0);
  return start;
}

/** Within ±10% of the calorie goal counts as "on target". */
export const ON_TARGET_TOLERANCE = 0.1;

export interface AdvancedAnalytics {
  loggedDays: number;
  /** Average calories per LOGGED day. 0 when nothing was logged. */
  avgCaloriesLoggedDays: number;
  onTargetDays: number;
  overDays: number;
  underDays: number;
  /** Average per logged weekday (Mon–Fri) / weekend day (Sat–Sun); null when none of that kind were logged. */
  weekdayAvg: number | null;
  weekendAvg: number | null;
  /** Share of all calories in the period by meal type, whole %, in a fixed order. */
  mealTypeShare: { mealType: MealType; percent: number; calories: number }[];
  /** Most frequently logged foods, by name (case-insensitive), most frequent first. */
  topFoods: { name: string; count: number; calories: number }[];
  /** First and last weight logged inside the period; null with fewer than two logs. */
  weightChange: { startKg: number; endKg: number; changeKg: number } | null;
}

const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function computeAdvancedAnalytics(
  meals: Meal[],
  weightLogs: WeightLog[],
  period: ProgressPeriod,
  calorieGoal: number,
  now: Date = new Date(),
): AdvancedAnalytics {
  const start = periodStart(period, now);
  const periodMeals = meals.filter((m) => m.loggedAt >= start && m.loggedAt <= now);

  const caloriesByDay = new Map<string, { calories: number; weekend: boolean }>();
  for (const meal of periodMeals) {
    const key = localDayKey(meal.loggedAt);
    const day = meal.loggedAt.getDay();
    const entry = caloriesByDay.get(key) ?? { calories: 0, weekend: day === 0 || day === 6 };
    entry.calories += meal.calories;
    caloriesByDay.set(key, entry);
  }

  const days = [...caloriesByDay.values()];
  const loggedDays = days.length;
  const avg = (values: number[]) => (values.length > 0 ? Math.round(values.reduce((s, v) => s + v, 0) / values.length) : null);

  let onTargetDays = 0;
  let overDays = 0;
  let underDays = 0;
  for (const { calories } of days) {
    if (calorieGoal > 0 && calories > calorieGoal * (1 + ON_TARGET_TOLERANCE)) overDays++;
    else if (calorieGoal > 0 && calories < calorieGoal * (1 - ON_TARGET_TOLERANCE)) underDays++;
    else onTargetDays++;
  }

  const totalCalories = periodMeals.reduce((s, m) => s + m.calories, 0);
  const mealTypeShare = MEAL_TYPES.map((mealType) => {
    const calories = periodMeals.filter((m) => m.mealType === mealType).reduce((s, m) => s + m.calories, 0);
    return { mealType, calories, percent: totalCalories > 0 ? Math.round((calories / totalCalories) * 100) : 0 };
  });

  const foods = new Map<string, { name: string; count: number; calories: number }>();
  for (const meal of periodMeals) {
    for (const food of meal.foods) {
      const key = food.name.trim().toLowerCase();
      if (!key) continue;
      const entry = foods.get(key) ?? { name: food.name.trim(), count: 0, calories: 0 };
      entry.count++;
      entry.calories += food.calories;
      foods.set(key, entry);
    }
  }
  const topFoods = [...foods.values()].sort((a, b) => b.count - a.count || b.calories - a.calories).slice(0, 5);

  const periodWeights = weightLogs
    .filter((log) => log.loggedAt >= start && log.loggedAt <= now)
    .sort((a, b) => a.loggedAt.getTime() - b.loggedAt.getTime());
  const weightChange =
    periodWeights.length >= 2
      ? {
          startKg: periodWeights[0]!.weightKg,
          endKg: periodWeights[periodWeights.length - 1]!.weightKg,
          changeKg: Math.round((periodWeights[periodWeights.length - 1]!.weightKg - periodWeights[0]!.weightKg) * 10) / 10,
        }
      : null;

  return {
    loggedDays,
    avgCaloriesLoggedDays: avg(days.map((d) => d.calories)) ?? 0,
    onTargetDays,
    overDays,
    underDays,
    weekdayAvg: avg(days.filter((d) => !d.weekend).map((d) => d.calories)),
    weekendAvg: avg(days.filter((d) => d.weekend).map((d) => d.calories)),
    mealTypeShare,
    topFoods,
    weightChange,
  };
}
