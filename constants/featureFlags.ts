/**
 * Toggles for features that exist in the codebase but aren't finished yet
 * (Security/Appearance/Language settings, "add to another meal", and the
 * not-yet-built CalHow Pro perks beyond unlimited scans). Off for the V1
 * App Store submission so reviewers and users never hit a "Coming soon"
 * placeholder — Apple guideline 2.2 rejects apps for exactly this. Flip to
 * true once these actually ship in V2; no call site needs to change beyond
 * that.
 *
 * Does NOT gate CalHow Pro / the paywall itself — that's a real, live
 * subscription (see app/paywall.tsx, hooks/usePurchases.tsx).
 */
export const SHOW_COMING_SOON_FEATURES = false;
