import { useCallback, useState } from 'react';

interface UseAsyncActionResult<Args extends unknown[]> {
  run: (...args: Args) => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
}

/**
 * Wraps an async function with loading/error state so screens don't each
 * hand-roll the same try/catch/setState boilerplate. Errors are surfaced as
 * a plain string message (from ApiError / FirebaseError / Error), suitable
 * for inline display.
 */
export function useAsyncAction<Args extends unknown[]>(
  action: (...args: Args) => Promise<void>,
): UseAsyncActionResult<Args> {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (...args: Args) => {
      setLoading(true);
      setError(null);
      try {
        await action(...args);
      } catch (err) {
        setError(toMessage(err));
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [action],
  );

  const clearError = useCallback(() => setError(null), []);

  return { run, loading, error, clearError };
}

function toMessage(err: unknown): string {
  if (err instanceof Error) return humanizeFirebaseMessage(err.message);
  return 'Something went wrong. Please try again.';
}

/** Firebase error messages look like "Firebase: Error (auth/invalid-credential)." — trim to something readable. */
function humanizeFirebaseMessage(message: string): string {
  const match = message.match(/auth\/([a-z-]+)/);
  if (!match) return message;
  const code = match[1];
  const known: Record<string, string> = {
    'invalid-credential': 'Incorrect email or password.',
    'invalid-email': 'That email address looks invalid.',
    'user-not-found': 'No account found with that email.',
    'wrong-password': 'Incorrect email or password.',
    'email-already-in-use': 'An account already exists with that email.',
    'weak-password': 'Please choose a stronger password.',
    'too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'network-request-failed': 'Network error. Check your connection and try again.',
  };
  return known[code] ?? 'Something went wrong. Please try again.';
}
