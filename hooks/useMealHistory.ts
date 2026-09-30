import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { useLocalDay } from './useLocalDay';
import { subscribeToMealsForDate, subscribeToMealsSince, subscribeToRecentMeals } from '@/services/firestore';
import type { Meal } from '@/types/models';

interface UseMealHistoryResult {
  meals: Meal[];
  loading: boolean;
}

/**
 * Live-subscribes to the signed-in user's most recent logged meals
 * (default 200, newest first). Live rather than a one-time read because
 * the tab screens using it (History, Progress, Home) stay mounted — a
 * one-time read left them missing every meal saved after they opened.
 *
 * `enabled: false` skips the read entirely (returns no meals) — for
 * screens that only need history for a Pro feature.
 */
export function useMealHistory(count = 200, enabled = true): UseMealHistoryResult {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !enabled) {
      setMeals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return subscribeToRecentMeals(
      user.uid,
      (nextMeals) => {
        setMeals(nextMeals);
        setLoading(false);
      },
      count,
      () => setLoading(false),
    );
  }, [user, count, enabled]);

  return { meals, loading };
}

/**
 * Live-subscribes to every meal from the start of the local day `days` days
 * ago until now — for date-range views (Progress), where a fixed-size
 * useMealHistory would silently cut off older meals in long periods.
 */
export function useMealsSince(days: number): UseMealHistoryResult {
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
    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);
    setLoading(true);
    return subscribeToMealsSince(
      user.uid,
      since,
      (nextMeals) => {
        setMeals(nextMeals);
        setLoading(false);
      },
      () => setLoading(false),
    );
  }, [user, days, day]);

  return { meals, loading };
}

/**
 * Live-subscribes to the meals logged on one local calendar day (null =
 * nothing). History uses it for a picked date, which can be older than
 * the recent-meals window useMealHistory loads.
 */
export function useMealsForDay(date: Date | null): UseMealHistoryResult {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(false);
  const dayStartMs = date ? new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime() : null;

  useEffect(() => {
    if (!user || dayStartMs == null) {
      setMeals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    return subscribeToMealsForDate(user.uid, new Date(dayStartMs), (nextMeals) => {
      setMeals(nextMeals);
      setLoading(false);
    });
  }, [user, dayStartMs]);

  return { meals, loading };
}
