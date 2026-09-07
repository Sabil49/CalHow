import { Stack } from 'expo-router';
import { AuthGuard } from '@/components/navigation/AuthGuard';

export default function SettingsLayout() {
  return (
    <AuthGuard>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthGuard>
  );
}
