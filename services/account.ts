import {
  deleteUser,
  EmailAuthProvider,
  GoogleAuthProvider,
  OAuthProvider,
  reauthenticateWithCredential,
  revokeAccessToken,
  type User,
} from 'firebase/auth';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { GoogleSignin, isSuccessResponse } from '@react-native-google-signin/google-signin';
import { auth } from './firebase';
import { deleteAllUserData } from './firestore';

/**
 * Permanently deletes the signed-in user's CalHow account and data.
 *
 * SINGLE ENTRY POINT: this is the only function any screen should call to
 * delete an account.
 *
 *   1. Reauthenticate with the user's own sign-in method (Firebase requires
 *      a "recent" login for account deletion): their password, or a fresh
 *      Google / Apple sign-in for social accounts, which have no password.
 *   2. Delete Firestore data (users/{uid} + its meals/weightLogs/
 *      corrections subcollections) while still authenticated, since
 *      Firestore security rules need `request.auth` to still be valid.
 *   3. For Sign in with Apple, revoke the user's Apple token (App Store
 *      Review Guideline 5.1.1(v)). Best-effort: needs the Apple provider's
 *      key configured in the Firebase console, and never blocks deletion.
 *   4. Delete the Firebase Auth user record last.
 *
 * Data only the backend can reach — meal photos in Cloud Storage and
 * pending scan analyses — is removed by the backend's `onAccountDeleted`
 * trigger when step 4 happens (calhow-backend/functions/src/account/).
 */

export type ReauthMethod = 'password' | 'google' | 'apple';

/** How the signed-in user must reconfirm their identity to delete their account; null if signed out. */
export function getReauthMethod(user: User | null = auth.currentUser): ReauthMethod | null {
  const providers = user?.providerData.map((info) => info.providerId) ?? [];
  if (providers.includes('password')) return 'password';
  if (providers.includes('apple.com')) return 'apple';
  if (providers.includes('google.com')) return 'google';
  return null;
}

class DeletionCancelledError extends Error {
  constructor() {
    super('Account deletion was cancelled.');
  }
}

/** Firebase errors read like "Firebase: Error (auth/invalid-credential)." — turn the ones a user can hit into plain language. */
function friendlyAuthError(err: unknown): Error {
  const code = (err as { code?: string } | null)?.code;
  switch (code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return new Error('That password is incorrect. Please try again.');
    case 'auth/user-mismatch':
      return new Error('Please sign in with the same account you use for CalHow.');
    case 'auth/too-many-requests':
      return new Error('Too many attempts. Please wait a few minutes and try again.');
    case 'auth/network-request-failed':
      return new Error("Couldn't connect. Check your internet connection and try again.");
    default:
      return err instanceof Error ? err : new Error('Something went wrong. Please try again.');
  }
}

async function reauthenticate(user: User, method: ReauthMethod, currentPassword?: string): Promise<{ appleAuthorizationCode?: string }> {
  if (method === 'password') {
    if (!user.email || !currentPassword) throw new Error('Please enter your password.');
    await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, currentPassword));
    return {};
  }

  if (method === 'google') {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) throw new DeletionCancelledError();
    if (!response.data.idToken) throw new Error('Google sign-in did not return an ID token.');
    await reauthenticateWithCredential(user, GoogleAuthProvider.credential(response.data.idToken));
    return {};
  }

  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  let credential: AppleAuthentication.AppleAuthenticationCredential;
  try {
    credential = await AppleAuthentication.signInAsync({ requestedScopes: [], nonce: hashedNonce });
  } catch (err) {
    if ((err as { code?: string } | null)?.code === 'ERR_REQUEST_CANCELED') throw new DeletionCancelledError();
    throw err;
  }
  if (!credential.identityToken) throw new Error('Apple sign-in did not return an identity token.');
  await reauthenticateWithCredential(
    user,
    new OAuthProvider('apple.com').credential({ idToken: credential.identityToken, rawNonce }),
  );
  return { appleAuthorizationCode: credential.authorizationCode ?? undefined };
}

/** `currentPassword` is only needed (and only used) for email/password accounts — see getReauthMethod. */
export async function deleteAccount(currentPassword?: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('You must be signed in to delete your account.');
  }
  const method = getReauthMethod(user);
  if (!method) {
    throw new Error("We couldn't determine how you signed in. Please sign out, sign back in, and try again.");
  }

  let appleAuthorizationCode: string | undefined;
  try {
    ({ appleAuthorizationCode } = await reauthenticate(user, method, currentPassword));
  } catch (err) {
    throw err instanceof DeletionCancelledError ? err : friendlyAuthError(err);
  }

  await deleteAllUserData(user.uid);

  if (appleAuthorizationCode) {
    await revokeAccessToken(auth, appleAuthorizationCode).catch(() => {
      // Best-effort — see step 3 above.
    });
  }

  try {
    await deleteUser(user);
  } catch (err) {
    throw friendlyAuthError(err);
  }

  if (method === 'google') {
    // So the next Google sign-in on this device asks which account to use.
    await GoogleSignin.signOut().catch(() => {});
  }
}
