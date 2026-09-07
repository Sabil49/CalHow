import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  // @ts-expect-error — getReactNativePersistence is a real, documented
  // runtime export of firebase/auth for React Native (Firebase's own SDK
  // source even shows `import { initializeAuth, getReactNativePersistence }
  // from 'firebase/auth'` as the canonical usage). It's just not visible to
  // TypeScript here: this SDK version's `exports` map resolves the
  // package's flat top-level `"types"` entry (a universal, platform-
  // agnostic declaration file) before it reaches the platform-specific
  // typings that actually declare this function. Safe to ignore — remove
  // this suppression once a future firebase release fixes its typings.
  getReactNativePersistence,
  type Auth,
} from 'firebase/auth';
// eslint-disable-next-line import/no-extraneous-dependencies
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
import { getFirestore, initializeFirestore, type Firestore } from 'firebase/firestore';

/**
 * Firebase initialization.
 *
 * All values here come from EXPO_PUBLIC_* env vars (see .env.example).
 * These are Firebase *client* config values — they identify your project,
 * they are not secrets, and it's expected/normal for them to ship inside
 * a mobile app bundle. Actual access control lives in Firestore Security
 * Rules, not in hiding this config.
 *
 * We are on the Firebase Spark (free) plan, so this app does not use
 * Cloud Functions. Anything that needs a real secret (AI provider keys,
 * server-only validation) goes through the Next.js backend instead —
 * see services/api.ts.
 */

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

function assertConfigured() {
  const missing = Object.entries(firebaseConfig).filter(([, v]) => !v);
  if (missing.length > 0 && __DEV__) {
    // eslint-disable-next-line no-console
    console.warn(
      `[firebase] Missing config values: ${missing.map(([k]) => k).join(', ')}. ` +
        'Copy .env.example to .env and fill in your Firebase project settings.',
    );
  }
}
assertConfigured();

export const firebaseApp = getApps().length ? getApps()[0]! : initializeApp(firebaseConfig);

let authInstance: Auth;
try {
  authInstance = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  });
} catch {
  // initializeAuth throws if already initialized (e.g. Fast Refresh) —
  // fall back to the existing instance in that case.
  authInstance = getAuth(firebaseApp);
}
export const auth: Auth = authInstance;

/**
 * `ignoreUndefinedProperties: true` is required here: this codebase
 * routinely builds partial update objects with conditional fields like
 * `dateOfBirth: dateOfBirth || undefined` or
 * `weeklyPaceKg: isPaceRelevant ? weeklyPaceKg : undefined`. Without this
 * option, the Firestore SDK throws "Unsupported field value: undefined"
 * on any write containing such a field — which would happen on common,
 * expected paths (e.g. saving onboarding with an optional field left
 * blank, or saving a meal that needed no clarification). This makes
 * `undefined` behave as "omit this field" rather than a hard error,
 * matching how every write site in services/firestore.ts is written.
 */
let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(firebaseApp, { ignoreUndefinedProperties: true });
} catch {
  // initializeFirestore throws if already initialized (e.g. Fast Refresh) —
  // fall back to the existing instance in that case.
  firestoreInstance = getFirestore(firebaseApp);
}
export const db: Firestore = firestoreInstance;
