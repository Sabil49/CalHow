import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updatePassword,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth } from './firebase';
import { createUserProfile } from './firestore';

export type { User };

/**
 * Single switch controlling whether social sign-in buttons are
 * interactive anywhere in the app (Welcome/Social Auth/Login/Signup).
 * signInWithGoogle/Apple/Facebook below are not implemented yet — flip
 * this to true only once they actually work, so the UI and the
 * implementation change together instead of the UI lying about what's
 * available.
 */
export const SOCIAL_AUTH_ENABLED = false;

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
 * Social sign-in (Google / Apple / Facebook).
 *
 * NOT YET IMPLEMENTED — requires native OAuth setup (expo-auth-session /
 * @react-native-google-signin, Apple entitlements, Facebook SDK config)
 * which depends on real client IDs from each provider console. Wire this
 * up once those credentials exist; the Social_Auth screen already has the
 * UI and calls these functions so only the implementation needs filling in.
 * Until then, SOCIAL_AUTH_ENABLED (above) keeps the buttons that call
 * these disabled in the UI so they can't be reached.
 */
export async function signInWithGoogle(): Promise<User> {
  throw new Error('signInWithGoogle: not implemented — requires Google OAuth client setup.');
}

export async function signInWithApple(): Promise<User> {
  throw new Error('signInWithApple: not implemented — requires Apple Sign In entitlement setup.');
}

export async function signInWithFacebook(): Promise<User> {
  throw new Error(
    'signInWithFacebook: not implemented — requires Facebook SDK app configuration.',
  );
}
