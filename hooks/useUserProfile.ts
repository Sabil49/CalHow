import { useEffect, useState } from 'react';
import { useAuth } from './useAuth';
import { subscribeToUserProfile } from '@/services/firestore';
import type { UserProfile } from '@/types/models';

interface UseUserProfileResult {
  profile: UserProfile | null;
  loading: boolean;
}

interface LoadedProfile {
  uid: string;
  profile: UserProfile | null;
}

/**
 * The last profile any subscription received. Firestore never calls a
 * snapshot listener synchronously, so without this every screen's FIRST
 * render would see `profile: null` — and edit screens that seed their form
 * state from the profile (`useState(profile?.x ?? default)`) would start
 * from defaults and overwrite the user's saved settings on Save. The app
 * keeps a profile subscription open from launch (root layout), so by the
 * time a screen mounts this is already warm.
 */
let lastProfile: LoadedProfile | null = null;

/**
 * Live-subscribes to users/{uid} for the signed-in user.
 *
 * `loading` is derived during render from whether the profile we hold
 * belongs to the CURRENT uid — not set from an effect — so there's no
 * render where a just-signed-in user reads as "loaded, no profile" (which
 * would send an existing user to onboarding; see app/index.tsx).
 */
export function useUserProfile(): UseUserProfileResult {
  const { user } = useAuth();
  const uid = user?.uid;
  const [loaded, setLoaded] = useState<LoadedProfile | null>(null);

  useEffect(() => {
    if (!uid) return;
    return subscribeToUserProfile(uid, (profile) => {
      lastProfile = { uid, profile };
      setLoaded({ uid, profile });
    });
  }, [uid]);

  if (!uid) return { profile: null, loading: false };
  const current = loaded?.uid === uid ? loaded : lastProfile?.uid === uid ? lastProfile : null;
  return current ? { profile: current.profile, loading: false } : { profile: null, loading: true };
}
