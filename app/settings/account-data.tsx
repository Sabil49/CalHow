import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DeleteAccountModal } from '@/components/settings/DeleteAccountModal';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useMealHistory } from '@/hooks/useMealHistory';
import { useWeightLogs } from '@/hooks/useWeightLogs';
import { deleteAccount } from '@/services/account';
import { theme } from '@/constants/theme';

export default function AccountDataScreen() {
  const { profile } = useUserProfile();
  const { meals, loading: mealsLoading } = useMealHistory();
  const { logs, loading: logsLoading } = useWeightLogs();
  const [modalVisible, setModalVisible] = useState(false);

  async function handleDeleteAccount(password: string) {
    await deleteAccount(password);
    // The auth listener in hooks/useAuth.tsx will pick up the sign-out;
    // navigate explicitly too so the user isn't left on a now-broken screen.
    router.replace('/(auth)/welcome');
  }

  return (
    <ScreenContainer>
      <AppHeader left="back" onLeftPress={() => router.back()} showProfile avatarUrl={profile?.photoUrl} />

      <Text style={styles.heading}>Account & Data</Text>
      <Text style={styles.subtitle}>See what's stored for your account, and manage or delete it.</Text>

      <Card style={styles.card}>
        <Text style={styles.cardTitle}>Your data</Text>
        <View style={styles.dataRow}>
          <Feather name="camera" size={16} color={theme.colors.brandDark} />
          <Text style={styles.dataLabel}>Meals logged</Text>
          <Text style={styles.dataValue}>{mealsLoading ? '—' : meals.length}</Text>
        </View>
        <View style={styles.dataRow}>
          <Feather name="bar-chart-2" size={16} color={theme.colors.brandDark} />
          <Text style={styles.dataLabel}>Weight entries</Text>
          <Text style={styles.dataValue}>{logsLoading ? '—' : logs.length}</Text>
        </View>
        <View style={styles.dataRow}>
          <Feather name="calendar" size={16} color={theme.colors.brandDark} />
          <Text style={styles.dataLabel}>Member since</Text>
          <Text style={styles.dataValue}>
            {profile?.memberSince
              ? new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(profile.memberSince)
              : '—'}
          </Text>
        </View>
      </Card>

      <Card style={styles.dangerCard}>
        <View style={styles.dangerHeaderRow}>
          <Feather name="alert-triangle" size={18} color={theme.colors.error} />
          <Text style={styles.dangerTitle}>Danger zone</Text>
        </View>
        <Text style={styles.dangerBody}>
          Deleting your account permanently removes your CalHow profile, meals, and weight history, and revokes your
          login. This cannot be undone.
        </Text>
        <Button label="Delete Account" variant="danger-ghost" icon="trash-2" onPress={() => setModalVisible(true)} style={styles.deleteButton} />
      </Card>

      <View style={styles.footnote}>
        <Feather name="info" size={12} color={theme.colors.textMuted} />
        <Text style={styles.footnoteText}>
          This deletes what CalHow's app stores for you today. If backend logs, uploaded photos, or billing records
          exist in the future, those systems will need their own deletion process — see services/account.ts.
        </Text>
      </View>

      <DeleteAccountModal visible={modalVisible} onDismiss={() => setModalVisible(false)} onConfirm={handleDeleteAccount} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...theme.text.screenHeading,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xl,
  },
  subtitle: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  card: {
    marginTop: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  cardTitle: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  dataLabel: {
    ...theme.text.body,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  dataValue: {
    ...theme.text.cardTitle,
    color: theme.colors.textSecondary,
  },
  dangerCard: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
    borderWidth: 1,
    borderColor: theme.colors.errorBg,
  },
  dangerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  dangerTitle: {
    ...theme.text.cardTitle,
    color: theme.colors.error,
  },
  dangerBody: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  deleteButton: {
    backgroundColor: theme.colors.errorBg,
    borderRadius: theme.radius.pill,
  },
  footnote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  footnoteText: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.textMuted,
    flex: 1,
  },
});
