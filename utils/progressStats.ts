import type { Meal } from '@/types/models';

/** Local calendar day, e.g. "2026-09-30" — local, not UTC, so late-evening meals count toward the right day. */
export function localDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Number of distinct local days with at least one logged meal — the divisor
 * for every "per day" average here. Dividing by the period length instead
 * (7/30/90/365) counted unlogged days as 0-calorie days, so the same eating
 * looked smaller the longer the period.
 */
function loggedDayCount(meals: Meal[]): number {
  return new Set(meals.map((m) => localDayKey(m.loggedAt))).size;
}

export type ProgressPeriod = 'week' | 'month' | '3months' | 'year';

export function periodToDays(period: ProgressPeriod): number {
  switch (period) {
    case 'week':
      return 7;
    case 'month':
      return 30;
    case '3months':
      return 90;
    case 'year':
      return 365;
  }
}

function mealsInPeriod(meals: Meal[], days: number): Meal[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  // Align to the start of that calendar day, not "N days ago at the
  // current time" — otherwise a meal logged earlier in the day than the
  // current wall-clock time on the oldest included day gets silently
  // excluded, so the same range under-counts depending on what time of
  // day you happen to open Progress.
  cutoff.setHours(0, 0, 0, 0);
  return meals.filter((m) => m.loggedAt >= cutoff);
}

export interface NutritionOverviewMetric {
  value: number;
  goal: number;
}

export interface NutritionOverview {
  calories: NutritionOverviewMetric;
  carbs: NutritionOverviewMetric;
  fats: NutritionOverviewMetric;
  protein: NutritionOverviewMetric;
  fiber: NutritionOverviewMetric;
}

interface GoalInputs {
  dailyCalorieTarget?: number;
  proteinG?: number;
  carbsG?: number;
  fatsG?: number;
  fiberG?: number;
}

/**
 * Per-day averages over the LOGGED days in the period, compared against
 * the user's daily goals. Averaging (rather than summing) keeps the
 * numbers meaningful regardless of which period is selected — a raw sum
 * over a year next to a single day's calorie goal wouldn't mean anything.
 */
export function computeNutritionOverview(meals: Meal[], period: ProgressPeriod, goals: GoalInputs): NutritionOverview {
  const periodMeals = mealsInPeriod(meals, periodToDays(period));
  const days = Math.max(1, loggedDayCount(periodMeals));
  const totals = periodMeals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.calories,
      carbs: acc.carbs + m.carbs,
      fats: acc.fats + m.fats,
      protein: acc.protein + m.protein,
      fiber: acc.fiber + (m.fiber ?? 0),
    }),
    { calories: 0, carbs: 0, fats: 0, protein: 0, fiber: 0 },
  );

  return {
    calories: { value: Math.round(totals.calories / days), goal: goals.dailyCalorieTarget ?? 2000 },
    carbs: { value: Math.round(totals.carbs / days), goal: goals.carbsG ?? 250 },
    fats: { value: Math.round(totals.fats / days), goal: goals.fatsG ?? 70 },
    protein: { value: Math.round(totals.protein / days), goal: goals.proteinG ?? 120 },
    fiber: { value: Math.round(totals.fiber / days), goal: goals.fiberG ?? 25 },
  };
}

export interface ChartBucket {
  label: string;
  value: number;
}

/** Buckets meals' calories into a small number of points suitable for a sparkline, regardless of period length. */
export function bucketCaloriesForChart(meals: Meal[], period: ProgressPeriod): ChartBucket[] {
  const days = periodToDays(period);
  const periodMeals = mealsInPeriod(meals, days);

  if (period === 'week') {
    const buckets: ChartBucket[] = [];
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    for (let i = 6; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      day.setHours(0, 0, 0, 0);
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);
      const kcal = periodMeals
        .filter((m) => m.loggedAt >= day && m.loggedAt < nextDay)
        .reduce((sum, m) => sum + m.calories, 0);
      buckets.push({ label: dayLabels[day.getDay()], value: kcal });
    }
    return buckets;
  }

  // Month / 3 Months / Year: split into ~8 equal-width buckets and average.
  const bucketCount = 8;
  const bucketSizeDays = days / bucketCount;
  const dateFmt = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  const buckets: ChartBucket[] = [];
  for (let i = 0; i < bucketCount; i++) {
    const end = new Date();
    end.setDate(end.getDate() - Math.round(i * bucketSizeDays));
    const start = new Date();
    start.setDate(start.getDate() - Math.round((i + 1) * bucketSizeDays));
    const bucketMeals = periodMeals.filter((m) => m.loggedAt >= start && m.loggedAt < end);
    const totalKcal = bucketMeals.reduce((sum, m) => sum + m.calories, 0);
    const daysInBucket = Math.max(1, loggedDayCount(bucketMeals));
    const midpoint = new Date((start.getTime() + end.getTime()) / 2);
    buckets.unshift({ label: dateFmt.format(midpoint), value: Math.round(totalKcal / daysInBucket) });
  }
  return buckets;
}

export interface MacroBalance {
  proteinG: number;
  carbsG: number;
  fatsG: number;
}

export function computeMacroBalance(meals: Meal[], period: ProgressPeriod): MacroBalance {
  const periodMeals = mealsInPeriod(meals, periodToDays(period));
  const days = Math.max(1, loggedDayCount(periodMeals));
  const totals = periodMeals.reduce(
    (acc, m) => ({ protein: acc.protein + m.protein, carbs: acc.carbs + m.carbs, fats: acc.fats + m.fats }),
    { protein: 0, carbs: 0, fats: 0 },
  );
  return {
    proteinG: Math.round(totals.protein / days),
    carbsG: Math.round(totals.carbs / days),
    fatsG: Math.round(totals.fats / days),
  };
}

/** Real, derivable "habit" metrics — see Progress screen comment on why this differs from the reference's 4-item grid. */
export function computeLoggingHabits(meals: Meal[], period: ProgressPeriod, fiberGoal = 25) {
  const days = periodToDays(period);
  const periodMeals = mealsInPeriod(meals, days);

  const loggedDateKeys = new Set<string>();
  const fiberByDate = new Map<string, number>();
  for (const meal of periodMeals) {
    // Local calendar day (toISOString() is the UTC date — evening meals west of UTC landed on the next day).
    const d = meal.loggedAt;
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    loggedDateKeys.add(key);
    fiberByDate.set(key, (fiberByDate.get(key) ?? 0) + (meal.fiber ?? 0));
  }
  const highFiberDays = [...fiberByDate.values()].filter((f) => f >= fiberGoal).length;

  return {
    daysLogged: loggedDateKeys.size,
    highFiberDays,
    totalDays: days,
  };
}
