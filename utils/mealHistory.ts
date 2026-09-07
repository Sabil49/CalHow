import type { Meal } from '@/types/models';

export interface MealDayGroup {
  label: string;
  dateKey: string;
  meals: Meal[];
}

function dateKeyOf(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
}

export function groupMealsByDay(meals: Meal[]): MealDayGroup[] {
  const todayKey = dateKeyOf(new Date());
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = dateKeyOf(yesterday);

  const map = new Map<string, Meal[]>();
  for (const meal of meals) {
    const key = dateKeyOf(meal.loggedAt);
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(meal);
  }

  const sortedKeys = [...map.keys()].sort((a, b) => b.localeCompare(a));

  return sortedKeys.map((key) => {
    let label: string;
    if (key === todayKey) label = 'Today';
    else if (key === yesterdayKey) label = 'Yesterday';
    else {
      label = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(key));
    }
    const dayMeals = map.get(key)!.sort((a, b) => b.loggedAt.getTime() - a.loggedAt.getTime());
    return { label, dateKey: key, meals: dayMeals };
  });
}

export interface WeeklyAverage {
  kcalPerDay: number;
  proteinPerDay: number;
  carbsPerDay: number;
  fatsPerDay: number;
}

/** Averages the last 7 calendar days (dividing by 7 regardless of how many days actually had logged meals). */
export function calcWeeklyAverage(meals: Meal[]): WeeklyAverage {
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recent = meals.filter((m) => m.loggedAt >= sevenDaysAgo);
  const totals = recent.reduce(
    (acc, m) => ({
      kcal: acc.kcal + m.calories,
      protein: acc.protein + m.protein,
      carbs: acc.carbs + m.carbs,
      fats: acc.fats + m.fats,
    }),
    { kcal: 0, protein: 0, carbs: 0, fats: 0 },
  );

  return {
    kcalPerDay: Math.round(totals.kcal / 7),
    proteinPerDay: Math.round(totals.protein / 7),
    carbsPerDay: Math.round(totals.carbs / 7),
    fatsPerDay: Math.round(totals.fats / 7),
  };
}
