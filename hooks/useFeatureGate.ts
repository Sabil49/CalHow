import { usePurchases } from './usePurchases';

/**
 * Every gated capability lives in this one enum-like list. To add a new
 * Pro feature later (V2), add its key here and call `useFeatureGate(key)`
 * wherever it's used — no navigation/architecture changes required.
 */
export const PRO_FEATURES = {
  unlimitedScans: 'unlimitedScans',
  smartMealMemory: 'smartMealMemory',
  aiMealInsights: 'aiMealInsights',
  advancedProgressAnalytics: 'advancedProgressAnalytics',
  restaurantMenuScanner: 'restaurantMenuScanner',
  eatNextSuggestions: 'eatNextSuggestions',
  customGoalsAndMacros: 'customGoalsAndMacros',
} as const;

export type ProFeature = keyof typeof PRO_FEATURES;

/**
 * Daily free-tier scan limit. Purely descriptive/optimistic-UX on this
 * side — the actual enforcement (and the real count of scans used today)
 * lives entirely in the backend, see
 * calhow-backend/services/usage/scanLimit.ts's DAILY_FREE_SCAN_LIMIT
 * (kept in sync manually, same as this app's other backend-mirrored
 * constants). This app never decides a user is out of scans on its own —
 * see app/scan/analyzing.tsx, which routes to /paywall only when the
 * backend responds with the `scan_limit_reached` error code.
 */
export const FREE_DAILY_SCAN_LIMIT = 3;

/**
 * Client-side/local Pro signal, sourced from RevenueCat's live
 * CustomerInfo (via hooks/usePurchases.tsx) — reflects the actual device
 * purchase state, not the Firestore `subscription.tier` cache (which a
 * user could edit directly via the Firestore client SDK and which is
 * never trusted for this reason — see
 * calhow-backend/services/usage/entitlement.ts). Still purely optimistic
 * UI: the backend independently re-verifies entitlement for anything
 * that actually needs to be gated.
 */
export function useIsPro(): boolean {
  const { isPro } = usePurchases();
  return isPro;
}

/**
 * Returns whether `feature` is unlocked for the current user. All Pro
 * features are gated the same way today (plain tier check), but keeping
 * this as a hook per-feature means per-feature rollout logic (e.g. beta
 * flags) can be added later without touching call sites.
 */
export function useFeatureGate(_feature: ProFeature): boolean {
  return useIsPro();
}
