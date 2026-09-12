import { StyleSheet } from 'react-native';
import { theme } from '@/constants/theme';

/**
 * Style for the <TabList> in app/(tabs)/_layout.tsx.
 *
 * This used to be a <BottomTabBar> component that rendered <TabList> itself,
 * but Expo Router's headless <Tabs> only registers screens from a <TabList>
 * that is one of its OWN JSX children — it doesn't render custom components
 * to discover one nested inside, so that wrapper caused "Couldn't find any
 * screens for the navigator". Only the style lives here now; the JSX is
 * inline in the layout.
 */
export const tabBarStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    marginHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.xs,
    ...theme.shadows.floating,
  },
});
