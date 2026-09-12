import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAdditionalUserInfo,
  GoogleAuthProvider,
  OAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';
import { createUserProfile } from './firestore';

export type { User };

export function subscribeToAuthChanges(callback: (user: User | null) => void) {
  return onAuthStateChanged(auth, callback);
}

export async function signUpWithEmail(params: {
  fullName: string;
  email: string;
  password: string;
}) {
  const credential = await createUserWithEmailAndPassword(auth, params.email, params.password);
  await updateProfile(credential.user, { displayName: params.fullName });
  await createUserProfile(credential.user.uid, {
    email: credential.user.email,
    fullName: params.fullName,
  });
  return credential.user;
}

export async function loginWithEmail(email: string, password: string) {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function sendPasswordReset(email: string) {
  await sendPasswordResetEmail(auth, email);
}

export async function signOut() {
  await firebaseSignOut(auth);
}

/** Whether this user signed up with email/password (as opposed to a social provider). */
export function isPasswordProvider(user: User): boolean {
  return user.providerData.some((info) => info.providerId === 'password');
}

/**
 * Changes the signed-in user's password. Requires reauthentication with
 * their current password first — Firebase rejects sensitive operations
 * like this with `auth/requires-recent-login` if the session is old, so
 * we proactively reauthenticate rather than waiting for that error.
 */
export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('You must be signed in with an email/password account to change your password.');
  }
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

/**
 * Social sign-in (Google / Apple).
 *
 * The native provider prompt itself (the Google account picker sheet /
 * Apple's Face ID sheet) is driven by hooks/useSocialAuth.ts — it's a
 * hook because @react-native-google-signin/google-signin and
 * expo-apple-authentication are both native-module APIs that need to run
 * from a component, not a plain service function. These two functions
 * are the second half: given the token the native SDK handed back,
 * exchange it for a Firebase session and — for a first-time social
 * sign-in — create the same users/{uid} profile doc signUpWithEmail
 * creates, so every account (email or social) has one from the start.
 */
async function ensureSocialUserProfile(user: User, isNewUser: boolean | undefined, fallbackFullName?: string) {
  if (!isNewUser) return;
  await createUserProfile(user.uid, {
    email: user.email,
    fullName: user.displayName || fallbackFullName || '',
  });
}

/** Exchanges a Google ID token (from GoogleSignin.signIn(), via useSocialAuth) for a Firebase session. */
export async function signInWithGoogleIdToken(idToken: string): Promise<User> {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  await ensureSocialUserProfile(result.user, getAdditionalUserInfo(result)?.isNewUser);
  return result.user;
}

/**
 * Exchanges an Apple identity token (from AppleAuthentication.signInAsync(),
 * via useSocialAuth) for a Firebase session. `rawNonce` must be the
 * un-hashed nonce whose SHA-256 digest was passed as the `nonce` option to
 * signInAsync — Firebase re-derives and checks that hash to confirm this
 * token was minted for this exact sign-in attempt.
 *
 * `fullName` is passed separately because Apple only ever includes the
 * user's name in the very first authorization response for this app —
 * every subsequent sign-in omits it, so it can't be re-derived from
 * `result.user` on a later call the way it can right after signup.
 */
export async function signInWithAppleCredential(params: {
  identityToken: string;
  rawNonce: string;
  fullName?: string;
}): Promise<User> {
  const provider = new OAuthProvider('apple.com');
  const credential = provider.credential({ idToken: params.identityToken, rawNonce: params.rawNonce });
  const result = await signInWithCredential(auth, credential);
  await ensureSocialUserProfile(result.user, getAdditionalUserInfo(result)?.isNewUser, params.fullName);
  return result.user;
}
