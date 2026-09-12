import { Tabs, TabList, TabSlot, TabTrigger } from 'expo-router/ui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthGuard } from '@/components/navigation/AuthGuard';
import { TabBarButton } from '@/components/navigation/TabBarButton';
import { tabBarStyles } from '@/components/navigation/BottomTabBar';
import { theme } from '@/constants/theme';

/**
 * Home / History / Progress / Profile.
 *
 * Expo Router's headless <Tabs> statically scans its OWN JSX children for a
 * <TabList> to register screens — it never renders custom components to see
 * what they return. So <TabList>/<TabTrigger> must live directly here (not
 * behind a wrapper like <BottomTabBar />), or `Tabs` throws "Couldn't find
 * any screens for the navigator".
 */
export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  return (
    <AuthGuard>
      <Tabs>
        <TabSlot />
        <TabList style={[tabBarStyles.container, { marginBottom: Math.max(insets.bottom, theme.spacing.md) }]}>
          <TabTrigger name="index" href="/" asChild>
            <TabBarButton icon="home" label="Home" />
          </TabTrigger>
          <TabTrigger name="history" href="/history" asChild>
            <TabBarButton icon="clock" label="History" />
          </TabTrigger>
          <TabTrigger name="progress" href="/progress" asChild>
            <TabBarButton icon="bar-chart-2" label="Progress" />
          </TabTrigger>
          <TabTrigger name="profile" href="/profile" asChild>
            <TabBarButton icon="user" label="Profile" />
          </TabTrigger>
        </TabList>
      </Tabs>
    </AuthGuard>
  );
}
