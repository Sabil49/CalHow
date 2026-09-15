/**
 * Toggles for features that exist in the codebase but aren't finished or
 * purchasable yet (CalHow Pro, Security/Appearance/Language settings,
 * "add to another meal"). Off for the V1 App Store submission so reviewers
 * and users never hit a "Coming soon" placeholder — Apple guideline 2.1
 * rejects apps for exactly this. Flip to true once these actually ship in
 * V2; no call site needs to change beyond that.
 */
export const SHOW_COMING_SOON_FEATURES = false;
