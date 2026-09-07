import { deleteUser, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { auth } from './firebase';
import { deleteAllUserData } from './firestore';

/**
 * Permanently deletes the signed-in user's CalHow account and data.
 *
 * SINGLE ENTRY POINT: this is the only function any screen should call to
 * delete an account. It's kept isolated here — rather than spread across
 * the UI — specifically so it can later be swapped for a call to a
 * Next.js `/api/account/delete` endpoint (using the Firebase Admin SDK for
 * privileged, guaranteed-complete server-side deletion) without touching
 * any screen code. When that endpoint exists, this function's body
 * becomes a single authenticated fetch() call instead of the steps below.
 *
 * Current (V1, client-side) implementation covers exactly what this Expo
 * app's Firestore schema and Firebase Auth account contain:
 *   1. Reauthenticate (Firebase requires a "recent" login for sensitive
 *      operations like account deletion — reauthenticating proactively
 *      avoids a separate retry-on-error step).
 *   2. Delete Firestore data (users/{uid} + its meals/weightLogs/
 *      corrections subcollections) while still authenticated, since
 *      Firestore security rules need `request.auth` to still be valid.
 *   3. Delete the Firebase Auth user record last.
 *
 * TODO(production): before this ships for real, a server-side deletion
 * path should also cover data this client-side function CANNOT see or
 * has no authority to remove:
 *   - Firebase Storage files (e.g. meal photos), once Storage is used
 *   - Any data the Next.js AI backend holds keyed by this uid (request
 *     logs, cached analyses, etc.)
 *   - Analytics data tied to this uid, if analytics are added later
 *   - Billing/subscription records with a payment provider (e.g.
 *     cancelling + purging RevenueCat/Stripe customer data), once real
 *     in-app purchases are wired up — see services/purchases.ts
 * None of those systems exist in this project yet, so there is nothing
 * for them to delete today — but that's exactly why real deletion should
 * move server-side once they do, rather than trusting a client to reach
 * every system correctly.
 */
export async function deleteAccount(currentPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to delete your account.');
  }
  if (!user.email) {
    throw new Error('Account deletion currently requires an email/password account.');
  }

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);

  await deleteAllUserData(user.uid);
  await deleteUser(user);
}
