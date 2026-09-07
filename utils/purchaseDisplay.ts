import type { PurchasesPackage } from 'react-native-purchases';

/**
 * Formatting helpers that turn RevenueCat/store metadata into display
 * text — kept separate from services/purchases.ts (which only talks to
 * the SDK) and app/paywall.tsx (which only renders). Nothing here
 * fabricates a price or trial length; every value is read from the
 * `PurchasesPackage`/`PurchasesStoreProduct` the store actually returned.
 */

/** e.g. "$49.99 / year" — the store's own formatted price string, never a hardcoded number. */
export function describePackagePrice(pkg: PurchasesPackage): string {
  return pkg.product.priceString;
}

/**
 * Describes the package's actual free-trial offer, e.g. "7-day free trial",
 * derived from `product.introPrice` (present only when the store has a
 * free-trial phase configured for this product/user). Returns `null` when
 * there is no free trial — callers should hide trial copy entirely in
 * that case rather than claiming one exists.
 *
 * Deliberately only recognizes a genuine FREE trial (price === 0), not a
 * paid introductory/discounted price — those are a different offer and
 * would be misleading to describe as "free".
 */
export function describeFreeTrial(pkg: PurchasesPackage): string | null {
  const intro = pkg.product.introPrice;
  if (!intro || intro.price !== 0) return null;

  const unitLabel = describePeriodUnit(intro.periodUnit, intro.periodNumberOfUnits);
  if (!unitLabel) return null;

  return `${intro.periodNumberOfUnits}-${unitLabel} free trial`;
}

/** Singular unit name for "N-<unit>" phrasing, e.g. "7-day", "2-week" — this style doesn't pluralize the unit itself. */
function describePeriodUnit(periodUnit: string, _count: number): string | null {
  switch (periodUnit) {
    case 'DAY':
      return 'day';
    case 'WEEK':
      return 'week';
    case 'MONTH':
      return 'month';
    case 'YEAR':
      return 'year';
    default:
      return null;
  }
}
