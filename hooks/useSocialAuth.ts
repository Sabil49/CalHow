import { useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { signInWithAppleCredential, signInWithGoogleIdToken } from '@/services/auth';

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
});

/** Builds a fresh, cryptographically random nonce and its SHA-256 hex digest for Apple's replay-protection flow. */
async function createNonce(): Promise<{ rawNonce: string; hashedNonce: string }> {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);
  return { rawNonce, hashedNonce };
}

interface UseSocialAuthResult {
  /** Resolves `true` on a completed sign-in, `false` on cancellation or failure — the (auth) screens have no auto-redirect-on-sign-in the way protected routes do (see AuthGuard), so callers navigate themselves on `true`. */
  signInWithGoogle: () => Promise<boolean>;
  signInWithApple: () => Promise<boolean>;
  googleLoading: boolean;
  appleLoading: boolean;
  /** Apple Sign In is iOS-only — Android/web screens should hide that button entirely rather than show a button that always fails. */
  appleAvailable: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Drives the native Google/Apple sign-in prompts and hands the resulting
 * token to services/auth.ts for the Firebase credential exchange. A hook
 * (not a plain async function) because both native SDKs this wraps need
 * to run from a mounted component. Used by login.tsx, signup.tsx, and
 * social-login.tsx — each just needs `onPress={signInWithGoogle}` /
 * `onPress={signInWithApple}` plus the loading flags for its buttons.
 */
export function useSocialAuth(): UseSocialAuthResult {
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const signInWithGoogle = useCallback(async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();
      if (!isSuccessResponse(response)) return false; // user cancelled — not an error
      const { idToken } = response.data;
      if (!idToken) throw new Error('Google sign-in did not return an ID token.');
      await signInWithGoogleIdToken(idToken);
      return true;
    } catch (err) {
      if (isErrorWithCode(err) && (err.code === statusCodes.SIGN_IN_CANCELLED || err.code === statusCodes.IN_PROGRESS)) {
        return false; // user cancelled, or a prior prompt is still open — not an error
      }
      setError(err instanceof Error ? err.message : 'Google sign-in failed. Please try again.');
      return false;
    } finally {
      setGoogleLoading(false);
    }
  }, []);

  const signInWithApple = useCallback(async () => {
    setError(null);
    setAppleLoading(true);
    try {
      const { rawNonce, hashedNonce } = await createNonce();
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
        nonce: hashedNonce,
      });
      if (!credential.identityToken) throw new Error('Apple sign-in did not return an identity token.');
      const fullName = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(' ').trim();
      await signInWithAppleCredential({
        identityToken: credential.identityToken,
        rawNonce,
        fullName: fullName || undefined,
      });
      return true;
    } catch (err) {
      const code = (err as { code?: string } | null)?.code;
      if (code === 'ERR_REQUEST_CANCELED') return false; // user cancelled — not an error
      setError(err instanceof Error ? err.message : 'Apple sign-in failed. Please try again.');
      return false;
    } finally {
      setAppleLoading(false);
    }
  }, []);

  return {
    signInWithGoogle,
    signInWithApple,
    googleLoading,
    appleLoading,
    appleAvailable: Platform.OS === 'ios',
    error,
    clearError: () => setError(null),
  };
}
