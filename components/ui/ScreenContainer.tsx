import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { theme } from '@/constants/theme';

interface ScreenContainerProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  edges?: Edge[];
  /** Turn off horizontal padding when a child (e.g. full-bleed hero image) needs to touch the edges. */
  noPadding?: boolean;
}

/**
 * Standard screen wrapper: warm cream background, safe-area aware,
 * consistent horizontal padding. Use `scroll` for content-heavy screens
 * and leave it off for screens that manage their own layout (e.g. camera).
 *
 * Wraps scrollable content in KeyboardAvoidingView so text fields near the
 * bottom of a form aren't hidden behind the keyboard — this is the shared
 * wrapper nearly every screen with a form uses, so fixing it here covers
 * Login/Signup/Personal Information/Change Password/Add Weight/etc. at once.
 */
export function ScreenContainer({
  children,
  scroll = true,
  style,
  contentStyle,
  edges = ['top', 'bottom'],
  noPadding = false,
}: ScreenContainerProps) {
  return (
    <SafeAreaView style={[styles.safeArea, style]} edges={edges}>
      {scroll ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
        >
          <ScrollView
            contentContainerStyle={[styles.content, !noPadding && styles.padded, contentStyle]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        <View style={[styles.content, !noPadding && styles.padded, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
  },
  padded: {
    paddingHorizontal: theme.spacing.lg,
  },
});
