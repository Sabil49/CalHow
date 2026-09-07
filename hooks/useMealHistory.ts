import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { getRecentMeals } from '@/services/firestore';
import type { Meal } from '@/types/models';

interface UseMealHistoryResult {
  meals: Meal[];
  loading: boolean;
  refresh: () => void;
}

/** Fetches the signed-in user's most recent logged meals (default 200, newest first). */
export function useMealHistory(count = 200): UseMealHistoryResult {
  const { user } = useAuth();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setMeals([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    getRecentMeals(user.uid, count).then((result) => {
      if (!cancelled) {
        setMeals(result);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user, count, refreshKey]);

  return { meals, loading, refresh: () => setRefreshKey((k) => k + 1) };
}
