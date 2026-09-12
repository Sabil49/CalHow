import { Platform } from 'react-native';
import Purchases, {
  PURCHASES_ERROR_CODE,
  type CustomerInfo,
  type PurchasesError,
  type PurchasesOffering,
  type PurchasesPackage,
} from 'react-native-purchases';

/**
 * RevenueCat integration — CalHow Pro in-app purchases.
 *
 * ---------------------------------------------------------------------
 * ARCHITECTURE
 * ---------------------------------------------------------------------
 *   Expo app (this file, via the react-native-purchases SDK)
 *     -> App Store / Google Play (native purchase sheet)
 *     -> RevenueCat (receipt validation, entitlement bookkeeping)
 *
 * This module — and hooks/usePurchases.tsx, which wraps it in a
 * Context/React-friendly shape for screens — is a CLIENT-SIDE
 * convenience layer only. Nothing here is trusted as proof of purchase
 * by the backend: calhow-backend/services/usage/entitlement.ts
 * independently re-verifies entitlement status against RevenueCat's own
 * server API before allowing anything gated (e.g. bypassing the free
 * scan quota). See that file's doc comment for the full security
 * rationale — this module exists to drive the purchase UI, not to grant
 * access to anything by itself.
 *
 * ---------------------------------------------------------------------
 * APP USER ID: the Firebase uid, always
 * ---------------------------------------------------------------------
 * `identifyPurchasesUser(uid)` calls `Purchases.logIn(uid)`, making the
 * Firebase Auth uid the RevenueCat "App User ID" for this device. This is
 * what lets the SAME user restore their entitlement on a second device
 * (or after a reinstall) just by signing back into the same Firebase
 * account — no separate account-linking step — and it's also exactly the
 * identifier the backend looks the user up by (see
 * calhow-backend/services/usage/entitlement.ts).
 *
 * ---------------------------------------------------------------------
 * ENTITLEMENT
 * ---------------------------------------------------------------------
 * One RevenueCat entitlement, `calhow_pro`, unlocked by EITHER the
 * monthly or yearly product (both attached to the same entitlement in
 * the RevenueCat dashboard — see the project's setup notes). This module
 * never branches on a specific product identifier to decide Pro status;
 * `isProFromCustomerInfo` only ever checks
 * `entitlements.active[CALHOW_PRO_ENTITLEMENT_ID]`.
 *
 * ---------------------------------------------------------------------
 * NO HARDCODED PRICES
 * ---------------------------------------------------------------------
 * This file never contains a price or trial-length string. Screens read
 * `PurchasesPackage.product.priceString` / `.introPrice` (live from the
 * store, via `fetchCurrentOffering()`) — see app/paywall.tsx and
 * utils/purchaseDisplay.ts for how those are turned into display text,
 * with static fallback copy shown only while offerings are still loading
 * or if the fetch fails.
 */

export const CALHOW_PRO_ENTITLEMENT_ID = 'calhow_pro';

const IOS_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_API_KEY;
const ANDROID_API_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY;

let configured = false;

/**
 * Initializes the RevenueCat SDK. Safe to call more than once (a no-op
 * after the first successful call) — call once, early, from
 * hooks/usePurchases.tsx. Does nothing (and warns in dev) if no API key
 * is configured for the current platform, rather than throwing and
 * crashing app startup — see .env.example for what to set.
 */
export function configurePurchases(): void {
  if (configured) return;

  const apiKey = Platform.OS === 'ios' ? IOS_API_KEY : ANDROID_API_KEY;
  if (!apiKey) {
    if (__DEV__) {
      // eslint-disable-next-line no-console
      console.warn(
        `[purchases] Missing RevenueCat API key for platform "${Platform.OS}". ` +
          'Set EXPO_PUBLIC_REVENUECAT_IOS_API_KEY / EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY — see .env.example.',
      );
    }
    return;
  }

  Purchases.configure({ apiKey });
  configured = true;
}

/** True once configurePurchases() has successfully run — every other function here is a no-op/safe-empty-result until then. */
export function isPurchasesConfigured(): boolean {
  return configured;
}

/**
 * Sets the RevenueCat App User ID to the signed-in user's Firebase uid —
 * see the module doc comment's APP USER ID section. Returns the resulting
 * CustomerInfo (null if the SDK isn't configured, e.g. missing API key).
 */
export async function identifyPurchasesUser(uid: string): Promise<CustomerInfo | null> {
  if (!configured) return null;
  const { customerInfo } = await Purchases.logIn(uid);
  return customerInfo;
}

/**
 * Reverts RevenueCat to a fresh anonymous user — called on sign-out so a
 * different person signing in on the same device never inherits the
 * previous person's local purchase state. Swallows errors: logging out
 * of RevenueCat is a hygiene step, not something that should block or
 * fail Firebase sign-out.
 */
export async function logOutPurchasesUser(): Promise<void> {
  if (!configured) return;
  try {
    await Purchases.logOut();
  } catch {
    // Throws if already anonymous / not configured — harmless to ignore here.
  }
}

/** The current offering (its `monthly`/`annual` packages carry live store pricing) — null if unavailable or the SDK isn't configured. */
export async function fetchCurrentOffering(): Promise<PurchasesOffering | null> {
  if (!configured) return null;
  const offerings = await Purchases.getOfferings();
  return offerings.current;
}

export interface PurchaseOutcome {
  success: boolean;
  /** True when the user backed out of the native purchase sheet — not an error, callers should stay silent rather than showing an error alert. */
  userCancelled: boolean;
  customerInfo: CustomerInfo | null;
}

function isPurchasesError(err: unknown): err is PurchasesError {
  return typeof err === 'object' && err !== null && 'code' in err;
}

/** Buys `pkg` via the native purchase sheet. A user-cancelled purchase resolves with `userCancelled: true`, not a thrown error — any other failure rethrows for the caller to surface. */
export async function purchasePackage(pkg: PurchasesPackage): Promise<PurchaseOutcome> {
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { success: true, userCancelled: false, customerInfo };
  } catch (err) {
    if (isPurchasesError(err) && (err.code === PURCHASES_ERROR_CODE.PURCHASE_CANCELLED_ERROR || err.userCancelled)) {
      return { success: false, userCancelled: true, customerInfo: null };
    }
    throw err;
  }
}

export async function restorePurchases(): Promise<CustomerInfo> {
  return Purchases.restorePurchases();
}

export async function getCustomerInfo(): Promise<CustomerInfo> {
  return Purchases.getCustomerInfo();
}

/** Client-side/local convenience check only — see the module doc comment. Never treat this as authoritative. */
export function isProFromCustomerInfo(info: CustomerInfo | null): boolean {
  if (!info) return false;
  return info.entitlements.active[CALHOW_PRO_ENTITLEMENT_ID] != null;
}

/**
 * Subscribes to live CustomerInfo updates (e.g. a renewal or an
 * externally-completed purchase) — returns an unsubscribe function.
 * No-ops (returns a harmless unsubscribe) when the SDK isn't configured,
 * matching every other function in this module — registering a listener
 * with an unconfigured SDK isn't meaningful and, on some platforms/shims,
 * isn't safe to call at all.
 */
export function addCustomerInfoListener(listener: (info: CustomerInfo) => void): () => void {
  if (!configured) return () => {};
  Purchases.addCustomerInfoUpdateListener(listener);
  return () => {
    Purchases.removeCustomerInfoUpdateListener(listener);
  };
}
