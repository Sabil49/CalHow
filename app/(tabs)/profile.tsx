import React from 'react';
import { Alert, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { CalHowLogo } from '@/components/ui/CalHowLogo';
import { Card } from '@/components/ui/Card';
import { SettingsRow } from '@/components/ui/SettingsRow';
import { useIsPro } from '@/hooks/useFeatureGate';
import { useUserProfile } from '@/hooks/useUserProfile';
import { signOut } from '@/services/auth';
import { theme } from '@/constants/theme';

function notImplemented(feature: string) {
  Alert.alert(feature, 'This settings screen isn\u2019t built yet — coming in a future update.');
}

export default function ProfileScreen() {
  const { profile } = useUserProfile();
  const isPro = useIsPro();
  const memberSinceLabel = profile?.memberSince
    ? new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(profile.memberSince)
    : '—';

  async function handleLogout() {
    Alert.alert('Log out', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/');
        },
      },
    ]);
  }

  return (
    <ScreenContainer>
      <View style={styles.topBar}>
        <CalHowLogo markSize={24} textSize={theme.fontSize.lg} />
        <Pressable style={styles.bellButton} onPress={() => notImplemented('Notifications')}>
          <Feather name="bell" size={18} color={theme.colors.textPrimary} />
        </Pressable>
      </View>

      <Text style={styles.heading}>
        Profile <Text style={styles.headingAccent}>& Settings</Text>
      </Text>
      <Text style={styles.subtitle}>Manage your profile, preferences and app settings.</Text>

      <Pressable style={styles.profileCard} onPress={() => router.push('/settings/personal-information')}>
        {profile?.photoUrl ? (
          <Image source={{ uri: profile.photoUrl }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Feather name="user" size={26} color={theme.colors.brandDark} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName} numberOfLines={1}>
            {profile?.fullName || 'Your name'}
          </Text>
          <Text style={styles.profileEmail} numberOfLines={1}>
            {profile?.email || ''}
          </Text>
          {isPro && (
            <View style={styles.proBadge}>
              <Feather name="award" size={11} color={theme.colors.brandDark} />
              <Text style={styles.proBadgeText}>CalHow Pro</Text>
            </View>
          )}
        </View>
        <Feather name="chevron-right" size={18} color={theme.colors.textMuted} />
      </Pressable>

      <Card style={styles.statsCard}>
        <StatItem icon="bar-chart-2" value={profile?.currentWeightKg ? `${profile.currentWeightKg.toFixed(1)} kg` : '—'} label="Current weight" />
        <StatItem icon="target" value={profile?.goals?.targetWeightKg ? `${profile.goals.targetWeightKg.toFixed(1)} kg` : '—'} label="Goal weight" />
        <StatItem icon="calendar" value={memberSinceLabel} label="Member since" small />
        <StatItem icon="zap" value={`${profile?.streakDays ?? 0}`} label="Day streak" />
      </Card>

      <Text style={styles.sectionHeading}>Account</Text>
      <Card style={styles.card}>
        <SettingsRow icon="user" title="Personal Information" subtitle="Update your name, email and more" onPress={() => router.push('/settings/personal-information')} />
        <SettingsRow icon="lock" title="Change Password" subtitle="Update your account password" onPress={() => router.push('/settings/change-password')} />
        <SettingsRow icon="shield" title="Security" subtitle="Manage 2FA and login security" onPress={() => notImplemented('Security')} />
        <SettingsRow icon="award" title="CalHow Pro" subtitle="Manage your subscription and billing" onPress={() => router.push('/paywall')} />
        <SettingsRow icon="database" title="Account & Data" subtitle="View your data, delete your account" onPress={() => router.push('/settings/account-data')} />
      </Card>

      <Text style={styles.sectionHeading}>Preferences</Text>
      <Card style={styles.card}>
        <SettingsRow icon="coffee" title="Dietary Preferences" subtitle="Vegetarian, allergies and more" onPress={() => router.push('/settings/dietary-preferences')} />
        <SettingsRow icon="target" title="Goals" subtitle="Calorie, macro and nutrient goals" onPress={() => router.push('/settings/goals')} />
        <SettingsRow icon="bell" title="Reminders" subtitle="Meal and activity reminders" onPress={() => router.push('/settings/reminders')} />
        <SettingsRow icon="sliders" title="Units" subtitle="Change weight, height and other units" onPress={() => router.push('/settings/units')} />
      </Card>

      <Text style={styles.sectionHeading}>General</Text>
      <Card style={styles.card}>
        <SettingsRow icon="droplet" title="Appearance" subtitle="Theme, colors and app icon" onPress={() => notImplemented('Appearance')} />
        <SettingsRow icon="globe" title="Language" trailingText="English" onPress={() => notImplemented('Language')} />
        <SettingsRow icon="help-circle" title="Help & Support" subtitle="FAQs, contact us and more" onPress={() => router.push('/settings/help-support')} />
        <SettingsRow icon="file-text" title="Terms & Policies" subtitle="Privacy policy, terms of use and more" onPress={() => router.push('/settings/terms')} />
      </Card>

      <Pressable style={styles.logoutButton} onPress={handleLogout}>
        <Feather name="log-out" size={16} color={theme.colors.error} />
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>
    </ScreenContainer>
  );
}

function StatItem({ icon, value, label, small }: { icon: keyof typeof Feather.glyphMap; value: string; label: string; small?: boolean }) {
  return (
    <View style={styles.statItem}>
      <Feather name={icon} size={14} color={theme.colors.brandDark} />
      <Text style={[styles.statValue, small && styles.statValueSmall]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.sm,
  },
  bellButton: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.card,
  },
  heading: {
    ...theme.text.screenHeading,
    fontSize: theme.fontSize['2xl'],
    color: theme.colors.brandPrimary,
    marginTop: theme.spacing.lg,
  },
  headingAccent: {
    color: theme.colors.textPrimary,
  },
  subtitle: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xxs,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    marginTop: theme.spacing.lg,
    ...theme.shadows.card,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.pill,
  },
  avatarFallback: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.palette.lime100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: {
    ...theme.text.cardTitle,
    fontSize: theme.fontSize.md,
    color: theme.colors.textPrimary,
  },
  profileEmail: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.brandTint,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.xs,
    paddingVertical: 2,
    marginTop: 4,
  },
  proBadgeText: {
    ...theme.text.caption,
    fontSize: 10,
    color: theme.colors.brandDark,
    fontFamily: theme.fontFamily.sansSemiBold,
  },
  statsCard: {
    flexDirection: 'row',
    marginTop: theme.spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: theme.fontFamily.sansBold,
    fontSize: theme.fontSize.sm,
    color: theme.colors.textPrimary,
  },
  statValueSmall: {
    fontSize: 11,
  },
  statLabel: {
    ...theme.text.caption,
    fontSize: 10,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  sectionHeading: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xs,
  },
  card: {
    gap: 0,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.errorBg,
    borderRadius: theme.radius.lg,
    paddingVertical: theme.spacing.md,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
  },
  logoutText: {
    ...theme.text.bodyMedium,
    color: theme.colors.error,
  },
});
