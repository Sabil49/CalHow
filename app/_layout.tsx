import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts as usePlayfairFonts,
  PlayfairDisplay_400Regular,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_600SemiBold,
  PlayfairDisplay_700Bold,
} from '@expo-google-fonts/playfair-display';
import {
  useFonts as useInterFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { AuthProvider, useAuth } from '@/hooks/useAuth';
import { PurchasesProvider } from '@/hooks/usePurchases';
import { ScanSessionProvider } from '@/hooks/useScanSession';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getNotificationPermissionGranted, syncScheduledReminders } from '@/services/notifications';
import { theme } from '@/constants/theme';

/**
 * Keeps the OS's scheduled reminder notifications in sync with Firestore
 * on every app start, without ever prompting for permission itself (that
 * only happens from the Reminders screen's Save button). This covers:
 *   - a user who enabled reminders before this feature existed (nothing
 *     was ever scheduled for them until they revisit Settings otherwise)
 *   - a reinstall, where the OS's previously-scheduled notifications are
 *     gone but the Firestore preference survived
 * Silently does nothing if permission was never granted.
 */
function ReminderSync() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  // Firestore's live listener re-fires with a new `profile` object
  // reference on every snapshot (cache, then server) even when the data
  // is unchanged. Keying the effect off this serialized value instead of
  // `profile` itself avoids redundant re-syncs for those no-op updates —
  // syncScheduledReminders is already safe to call repeatedly (it's
  // serialized, see services/notifications.ts), this is purely to cut
  // needless churn.
  const remindersKey = JSON.stringify(profile?.reminders ?? null);

  useEffect(() => {
    if (!user || !profile) return;
    getNotificationPermissionGranted().then((granted) => {
      if (granted) void syncScheduledReminders(profile.reminders);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, remindersKey]);

  return null;
}

SplashScreen.preventAutoHideAsync().catch(() => {
  /* no-op: fails harmlessly if already hidden */
});

export default function RootLayout() {
  const [playfairLoaded] = usePlayfairFonts({
    PlayfairDisplay_400Regular,
    PlayfairDisplay_500Medium,
    PlayfairDisplay_600SemiBold,
    PlayfairDisplay_700Bold,
  });
  const [interLoaded] = useInterFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  const fontsLoaded = playfairLoaded && interLoaded;

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    // Keep the native splash screen visible instead of rendering an
    // in-JS fallback — avoids a flash of unstyled/system-font text.
    return null;
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PurchasesProvider>
          <ScanSessionProvider>
            <ReminderSync />
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: theme.colors.background },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="scan" />
              <Stack.Screen name="meal" />
              <Stack.Screen name="settings" />
              <Stack.Screen name="add-weight" options={{ presentation: 'modal' }} />
              <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
            </Stack>
          </ScanSessionProvider>
        </PurchasesProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
