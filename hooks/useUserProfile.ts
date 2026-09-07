import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { subscribeToUserProfile } from '@/services/firestore';
import type { UserProfile } from '@/types/models';

interface UseUserProfileResult {
  profile: UserProfile | null;
  loading: boolean;
}

/** Live-subscribes to users/{uid} for the signed-in user. */
export function useUserProfile(): UseUserProfileResult {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = subscribeToUserProfile(user.uid, (nextProfile) => {
      setProfile(nextProfile);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  return { profile, loading };
}
