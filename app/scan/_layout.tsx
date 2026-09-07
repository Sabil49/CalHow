import { Stack } from 'expo-router';
import { AuthGuard } from '@/components/navigation/AuthGuard';

/**
 * Scan -> AI Analyzing -> Clarify (conditional) -> Review -> Result.
 * Kept as its own stack (not nested in the tabs) so it can be presented
 * full-screen over Home and popped back to Home once a meal is saved.
 */
export default function ScanLayout() {
  return (
    <AuthGuard>
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_bottom' }} />
    </AuthGuard>
  );
}
