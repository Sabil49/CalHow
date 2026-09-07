import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { CustomerInfo, PurchasesOffering, PurchasesPackage } from 'react-native-purchases';
import { useAuth } from './useAuth';
import {
  addCustomerInfoListener,
  configurePurchases,
  fetchCurrentOffering,
  getCustomerInfo,
  identifyPurchasesUser,
  isProFromCustomerInfo,
  logOutPurchasesUser,
  purchasePackage as purchasePackageApi,
  restorePurchases as restorePurchasesApi,
} from '@/services/purchases';
import { updateUserProfile } from '@/services/firestore';

/**
 * React-facing wrapper around services/purchases.ts — a single place
 * (mirroring hooks/useAuth.tsx's pattern for Firebase auth state) that:
 *   - initializes the RevenueCat SDK once at app startup
 *   - logs the RevenueCat App User ID in/out as Firebase auth state
 *     changes (see services/purchases.ts's APP USER ID doc comment)
 *   - keeps live CustomerInfo available to any screen via `usePurchases()`
 *
 * `isPro` here is a CLIENT-SIDE convenience value for optimistic UI only
 * (e.g. dimming/hiding Pro-only affordances, showing "You're already Pro"
 * on the paywall). It is never sent to, or trusted by, the backend — see
 * calhow-backend/services/usage/entitlement.ts, which independently
 * re-verifies against RevenueCat's server API for anything that actually
 * gates access (the free scan quota today).
 */

interface PurchasesContextValue {
  /** True while identifying the user / doing the initial CustomerInfo+offering fetch. */
  loading: boolean;
  error: string | null;
  customerInfo: CustomerInfo | null;
  /** Client-side/local only — see the module doc comment above. */
  isPro: boolean;
  offering: PurchasesOffering | null;
  refresh: () => Promise<void>;
  purchase: (pkg: PurchasesPackage) => Promise<{ success: boolean; userCancelled: boolean }>;
  restore: () => Promise<void>;
}

const PurchasesContext = createContext<PurchasesContextValue | null>(null);

export function PurchasesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [offering, setOffering] = useState<PurchasesOffering | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Mirrors the client-observed Pro status into users/{uid}.subscription
   * for offline-friendly/cross-screen UI display ONLY. Deliberately
   * best-effort (a failed cache write is swallowed, never surfaced as a
   * purchase error) — and, per calhow-backend/services/usage/
   * entitlement.ts, this Firestore field is never read for real
   * entitlement decisions, only written here as a cache.
   */
  const syncProfileCache = useCallback(async (uid: string, info: CustomerInfo) => {
    try {
      await updateUserProfile(uid, { subscription: { tier: isProFromCustomerInfo(info) ? 'pro' : 'free' } });
    } catch {
      // Best-effort informational cache — never block the real purchase/entitlement flow on this.
    }
  }, []);

  useEffect(() => {
    configurePurchases();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function sync() {
      if (!user) {
        await logOutPurchasesUser();
        if (!cancelled) {
          setCustomerInfo(null);
          setOffering(null);
          setError(null);
        }
        return;
      }

      setLoading(true);
      setError(null);
      try {
        const info = await identifyPurchasesUser(user.uid);
        if (cancelled) return;
        setCustomerInfo(info);
        if (info) await syncProfileCache(user.uid, info);

        const currentOffering = await fetchCurrentOffering();
        if (cancelled) return;
        setOffering(currentOffering);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Could not load subscription status.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    sync();
    return () => {
      cancelled = true;
    };
  }, [user, syncProfileCache]);

  useEffect(() => {
    const unsubscribe = addCustomerInfoListener((info) => {
      setCustomerInfo(info);
      if (user) void syncProfileCache(user.uid, info);
    });
    return unsubscribe;
  }, [user, syncProfileCache]);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const info = await getCustomerInfo();
      setCustomerInfo(info);
      if (user) await syncProfileCache(user.uid, info);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not refresh subscription status.');
    }
  }, [user, syncProfileCache]);

  const purchase = useCallback(
    async (pkg: PurchasesPackage) => {
      const outcome = await purchasePackageApi(pkg);
      if (outcome.customerInfo) {
        setCustomerInfo(outcome.customerInfo);
        if (user) await syncProfileCache(user.uid, outcome.customerInfo);
      }
      return { success: outcome.success, userCancelled: outcome.userCancelled };
    },
    [user, syncProfileCache],
  );

  const restore = useCallback(async () => {
    const info = await restorePurchasesApi();
    setCustomerInfo(info);
    if (user) await syncProfileCache(user.uid, info);
  }, [user, syncProfileCache]);

  const isPro = useMemo(() => isProFromCustomerInfo(customerInfo), [customerInfo]);

  const value = useMemo<PurchasesContextValue>(
    () => ({ loading, error, customerInfo, isPro, offering, refresh, purchase, restore }),
    [loading, error, customerInfo, isPro, offering, refresh, purchase, restore],
  );

  return <PurchasesContext.Provider value={value}>{children}</PurchasesContext.Provider>;
}

export function usePurchases() {
  const ctx = useContext(PurchasesContext);
  if (!ctx) throw new Error('usePurchases must be used within PurchasesProvider');
  return ctx;
}
