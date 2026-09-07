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
import { AuthProvider } from '@/hooks/useAuth';
import { PurchasesProvider } from '@/hooks/usePurchases';
import { ScanSessionProvider } from '@/hooks/useScanSession';
import { theme } from '@/constants/theme';

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
