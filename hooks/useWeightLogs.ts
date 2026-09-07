import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { subscribeToWeightLogs } from '@/services/firestore';
import type { WeightLog } from '@/types/models';

interface UseWeightLogsResult {
  logs: WeightLog[];
  loading: boolean;
}

/** Live-subscribes to the signed-in user's weight logs, newest first. */
export function useWeightLogs(count = 60): UseWeightLogsResult {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WeightLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLogs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToWeightLogs(
      user.uid,
      (nextLogs) => {
        setLogs(nextLogs);
        setLoading(false);
      },
      count,
    );
    return unsubscribe;
  }, [user, count]);

  return { logs, loading };
}
