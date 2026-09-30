import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';
import { useLocalDay } from './useLocalDay';
import { subscribeToMealsForDate } from '@/services/firestore';
import type { Meal } from '@/types/models';

interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber: number;
}

interface UseTodayMealsResult {
  meals: Meal[];
  totals: NutritionTotals;
  loading: boolean;
}

/**
 * Live-subscribes to the signed-in user's meals logged today and sums up
 * totals. Re-subscribes when the local day changes (see useLocalDay), so
 * Home doesn't keep showing yesterday's meals after midnight.
 */
export function useTodayMeals(): UseTodayMealsResult {
  const { user } = useAuth();
  const day = useLocalDay();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setMeals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToMealsForDate(user.uid, new Date(), (nextMeals) => {
      setMeals(nextMeals);
      setLoading(false);
    });
    return unsubscribe;
  }, [user, day]);

  const totals = useMemo<NutritionTotals>(
    () =>
      meals.reduce(
        (acc, meal) => ({
          calories: acc.calories + meal.calories,
          protein: acc.protein + meal.protein,
          carbs: acc.carbs + meal.carbs,
          fats: acc.fats + meal.fats,
          fiber: acc.fiber + (meal.fiber ?? 0),
        }),
        { calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0 },
      ),
    [meals],
  );

  return { meals, totals, loading };
}
