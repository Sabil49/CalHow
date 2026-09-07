import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { theme } from '@/constants/theme';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * Wraps a protected route group's layout. Only `app/index.tsx` gated
 * navigation before this existed — meaning a deep link, a stale screen
 * still mounted right after sign-out/account deletion, or manual URL
 * entry (web) could reach (tabs)/scan/meal/settings/add-weight/paywall
 * while signed out, hitting code that assumes `user` is non-null.
 *
 * This is a belt-and-suspenders check: `app/index.tsx` still owns the
 * primary "where should this user land" decision (including onboarding
 * routing), this just ensures every protected group independently
 * refuses to render its content without a signed-in user.
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator color={theme.colors.brandPrimary} />
      </View>
    );
  }

  if (!user) {
    return <Redirect href="/(auth)/welcome" />;
  }

  return <>{children}</>;
}
