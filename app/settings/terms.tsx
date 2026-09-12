import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Card } from '@/components/ui/Card';
import { useUserProfile } from '@/hooks/useUserProfile';
import { theme } from '@/constants/theme';

export default function TermsScreen() {
  const { profile } = useUserProfile();

  return (
    <ScreenContainer>
      <AppHeader left="back" onLeftPress={() => router.back()} showProfile avatarUrl={profile?.photoUrl} />

      <Text style={styles.heading}>Terms & Policies</Text>
      <Text style={styles.subtitle}>Terms of Use</Text>

      <Card style={styles.card}>
        <Section title="1. Acceptance">
          CalHow is operated by MyZoApp ("we", "us"). By using CalHow, you agree to these Terms. CalHow is currently
          in beta — features, limits, and pricing may change before a public release.
        </Section>

        <Section title="2. Who can use CalHow">
          You must be at least 18 years old and able to form a binding agreement to use CalHow. You're responsible
          for keeping your account credentials secure.
        </Section>

        <Section title="3. What CalHow does">
          CalHow lets you photograph meals and get AI-estimated nutrition information (calories, protein, carbs,
          fats, fiber), track your weight over time, and view progress trends. Nutrition estimates come from an AI
          vision analysis of your photo cross-referenced against a public nutrition database (USDA FoodData
          Central) — they are estimates, not precise measurements.
        </Section>

        <Section title="4. Not medical advice">
          CalHow is a nutrition-tracking tool, not a medical device or a substitute for advice from a doctor,
          dietitian, or other qualified professional. Don't rely on CalHow for medical decisions, and talk to a
          professional before making significant changes to your diet.
        </Section>

        <Section title="5. Your content">
          You keep ownership of the meal photos and data you add to CalHow. By uploading a photo, you give CalHow
          permission to process it (including sending it to our AI and storage providers — see the Privacy Policy)
          solely to provide the app's features to you.
        </Section>

        <Section title="6. Free usage and CalHow Pro">
          CalHow currently offers a daily limit on free AI meal scans (shown in-app; temporarily raised during beta
          testing). CalHow Pro subscriptions are planned but not yet available for purchase — nothing in the current
          app will charge you.
        </Section>

        <Section title="7. Acceptable use">
          Don't use CalHow to upload content you don't have the right to share, attempt to disrupt the service, or
          reverse-engineer the app beyond what's permitted by law.
        </Section>

        <Section title="8. Account deletion">
          You can delete your account and data at any time from Profile → Account & Data. This is permanent and
          cannot be undone.
        </Section>

        <Section title="9. Governing law and disputes">
          CalHow is provided "as is" during this beta period, without warranties of any kind. These Terms are
          governed by the laws of India, and any dispute is subject to the exclusive jurisdiction of the courts of
          New Delhi, India. To the maximum extent permitted by law, CalHow and its developer are not liable for any
          indirect, incidental, or consequential damages arising from your use of the app, including decisions made
          based on nutrition estimates it provides.
        </Section>

        <Section title="10. Changes to these Terms">
          If these Terms change in a material way, we'll update this screen and adjust the "last updated" date
          below.
        </Section>

        <Section title="11. Contact">
          Questions about these Terms: md.sabeel10@gmail.com.
        </Section>

        <Text style={styles.lastUpdated}>Last updated: September 11, 2026.</Text>
      </Card>

      <Card style={styles.linkCard}>
        <Text style={styles.linkText} onPress={() => router.push('/settings/privacy')}>
          View Privacy Policy →
        </Text>
      </Card>
    </ScreenContainer>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionBody}>{children}</Text>
    </View>
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
    marginTop: theme.spacing.lg,
    gap: theme.spacing.md,
  },
  section: {
    gap: 4,
  },
  sectionTitle: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  sectionBody: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
  },
  lastUpdated: {
    ...theme.text.caption,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.sm,
  },
  linkCard: {
    marginTop: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
  },
  linkText: {
    ...theme.text.bodyMedium,
    color: theme.colors.brandDark,
  },
});
