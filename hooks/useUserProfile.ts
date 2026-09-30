import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { subscribeToUserProfile } from '@/services/firestore';
import type { UserProfile } from '@/types/models';

interface UseUserProfileResult {
  profile: UserProfile | null;
  loading: boolean;
}

/**
 * The last profile any subscription received, per uid. Firestore never
 * calls a snapshot listener synchronously, so without this every screen's
 * FIRST render would see `profile: null` — and edit screens that seed
 * their form state from the profile (`useState(profile?.x ?? default)`)
 * would start from defaults and overwrite the user's saved settings on
 * Save. The app keeps a profile subscription open from launch (root
 * layout), so by the time a screen mounts this is already warm.
 */
let lastProfile: { uid: string; profile: UserProfile | null } | null = null;

function cachedProfileFor(uid: string | undefined): UserProfile | null | undefined {
  return uid && lastProfile?.uid === uid ? lastProfile.profile : undefined;
}

/** Live-subscribes to users/{uid} for the signed-in user. */
export function useUserProfile(): UseUserProfileResult {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(() => cachedProfileFor(user?.uid) ?? null);
  const [loading, setLoading] = useState(() => cachedProfileFor(user?.uid) === undefined);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const cached = cachedProfileFor(user.uid);
    setProfile(cached ?? null);
    setLoading(cached === undefined);
    const unsubscribe = subscribeToUserProfile(user.uid, (nextProfile) => {
      lastProfile = { uid: user.uid, profile: nextProfile };
      setProfile(nextProfile);
      setLoading(false);
    });
    return unsubscribe;
  }, [user]);

  return { profile, loading };
}
