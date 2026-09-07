import React from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { CalHowLogo } from '@/components/ui/CalHowLogo';
import { theme } from '@/constants/theme';

interface AppHeaderProps {
  /** Left slot: back chevron, hamburger menu, or nothing. */
  left?: 'back' | 'menu' | 'none';
  onLeftPress?: () => void;
  /** Right slot: profile avatar + notification bell, or nothing. */
  showProfile?: boolean;
  avatarUrl?: string | null;
  hasNotification?: boolean;
  onAvatarPress?: () => void;
  onNotificationPress?: () => void;
}

/**
 * Shared header: white circular back/menu button on the left, the CalHow
 * wordmark centered, and (on authenticated screens) the user's avatar with
 * a notification bell on the right. Matches the header on Home, History,
 * Progress, Scan flow, etc.
 */
export function AppHeader({
  left = 'back',
  onLeftPress,
  showProfile = false,
  avatarUrl,
  hasNotification = false,
  onAvatarPress,
  onNotificationPress,
}: AppHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.side}>
        {left !== 'none' && (
          <Pressable
            onPress={onLeftPress}
            style={styles.circleButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={left === 'back' ? 'Go back' : 'Open menu'}
          >
            <Feather name={left === 'back' ? 'chevron-left' : 'menu'} size={20} color={theme.colors.textPrimary} />
          </Pressable>
        )}
      </View>

      <CalHowLogo markSize={26} textSize={theme.fontSize.lg} />

      <View style={[styles.side, styles.sideRight]}>
        {showProfile && (
          <View style={styles.profileCluster}>
            <Pressable onPress={onAvatarPress} hitSlop={6} accessibilityRole="button" accessibilityLabel="Open profile">
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Feather name="user" size={16} color={theme.colors.brandDark} />
                </View>
              )}
            </Pressable>
            <Pressable
              onPress={onNotificationPress}
              style={styles.bellButton}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={hasNotification ? 'Notifications, new activity' : 'Notifications'}
            >
              <Feather name="bell" size={14} color={theme.colors.textPrimary} />
              {hasNotification && <View style={styles.notificationDot} />}
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

const AVATAR_SIZE = 40;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
  },
  side: {
    width: 44,
  },
  sideRight: {
    width: 56,
    alignItems: 'flex-end',
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.card,
  },
  profileCluster: {
    position: 'relative',
  },
  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: theme.radius.pill,
  },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.palette.lime100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellButton: {
    position: 'absolute',
    bottom: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.card,
  },
  notificationDot: {
    position: 'absolute',
    top: 2,
    right: 2,
    width: 7,
    height: 7,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.warning,
  },
});
