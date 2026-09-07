import React, { forwardRef } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableProps } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

interface TabBarButtonProps extends PressableProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  /** Injected automatically by <TabTrigger asChild> when this is its child. */
  isFocused?: boolean;
}

/**
 * Rendered as the `asChild` target of a `<TabTrigger>` (see BottomTabBar).
 * Expo Router clones this element and injects `isFocused` + press handlers,
 * so this component only needs to worry about how an active vs. inactive
 * tab looks: a soft lime pill behind the icon when focused.
 */
export const TabBarButton = forwardRef<View, TabBarButtonProps>(function TabBarButton(
  { icon, label, isFocused = false, ...pressableProps },
  ref,
) {
  return (
    <Pressable
      ref={ref}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isFocused }}
      {...pressableProps}
      style={styles.tab}
    >
      <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
        <Feather name={icon} size={20} color={isFocused ? theme.colors.tabActive : theme.colors.tabInactive} />
      </View>
      <Text style={[styles.label, isFocused && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingTop: theme.spacing.xs,
  },
  iconWrap: {
    width: 52,
    height: 30,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    backgroundColor: theme.colors.tabActiveBg,
  },
  label: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.tabInactive,
  },
  labelActive: {
    color: theme.colors.tabActive,
    fontFamily: theme.fontFamily.sansSemiBold,
  },
});
