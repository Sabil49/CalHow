import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Card } from '@/components/ui/Card';
import { useUserProfile } from '@/hooks/useUserProfile';
import { theme } from '@/constants/theme';

export default function PrivacyScreen() {
  const { profile } = useUserProfile();

  return (
    <ScreenContainer>
      <AppHeader left="back" onLeftPress={() => router.back()} showProfile avatarUrl={profile?.photoUrl} />

      <Text style={styles.heading}>Terms & Policies</Text>
      <Text style={styles.subtitle}>Privacy Policy</Text>

      <Card style={styles.card}>
        <Section title="1. What this covers">
          CalHow is operated by MyZoApp ("the App", "we"). This Privacy Policy explains what information CalHow
          collects when you use the app, how it's used, and the choices you have. CalHow is currently in beta
          testing.
        </Section>

        <Section title="2. Information we collect">
          {'•'} Account info: name, email address, and (if you sign in with Google or Apple) the identifiers
          those providers share with us.{'\n\n'}
          {'•'} Profile info you enter: date of birth, gender, height, weight, activity level, dietary
          preferences and allergies, and nutrition goals.{'\n\n'}
          {'•'} Meal photos you scan, and the AI-generated food/nutrition data derived from them.{'\n\n'}
          {'•'} Weight log entries and any notes you add to them.{'\n\n'}
          {'•'} Corrections you make to AI-detected meals (used to improve future results).{'\n\n'}
          {'•'} Basic usage data needed to run the app, such as your daily scan count.
        </Section>

        <Section title="3. How we use it">
          To run the app's core features: analyzing meal photos, calculating nutrition, tracking your progress, and
          personalizing recommendations. We do not sell your personal data.
        </Section>

        <Section title="4. Third parties we share data with">
          CalHow relies on the following services to function. Each processes the data necessary for its role:{'\n\n'}
          {'•'} Firebase (Google) — authentication and database storage for your profile, meals, and weight
          logs.{'\n\n'}
          {'•'} Cloudinary — stores meal photos you scan.{'\n\n'}
          {'•'} Anthropic — CalHow sends your meal photos to Anthropic's Claude AI to identify foods and
          estimate nutrition. Anthropic does not receive your name or account identity directly from this call.{'\n\n'}
          {'•'} USDA FoodData Central — a public nutrition database used to calculate calories and macros for
          detected foods.{'\n\n'}
          {'•'} RevenueCat — manages subscription billing. Purchasing is currently disabled during the beta, so
          no payment data is processed yet.
        </Section>

        <Section title="5. Your choices">
          You can view, edit, or delete your data at any time from Profile → Account & Data. Deleting your account
          permanently removes your CalHow profile, meals, and weight history from our database.
        </Section>

        <Section title="6. Health information notice">
          CalHow's nutrition estimates are AI-generated approximations from a photo, not a medical or clinical
          measurement. Don't use CalHow as a substitute for professional medical, nutritional, or dietary advice.
        </Section>

        <Section title="7. Data retention">
          We keep your data for as long as your account is active. If you delete your account, your profile, meals,
          and weight history are deleted from our systems; some third-party providers may retain data briefly per
          their own retention windows.
        </Section>

        <Section title="8. Children">
          CalHow is not directed at, and may not be used by, anyone under 18 years old. If we learn that someone
          under 18 has created an account or provided personal information, we will delete that account and its
          associated data as soon as reasonably possible. If you believe a user under 18 has signed up, contact us
          at md.sabeel10@gmail.com so we can investigate and remove it.
        </Section>

        <Section title="9. Governing law">
          This Policy is governed by the laws of India, and any dispute over it is subject to the exclusive
          jurisdiction of the courts of New Delhi, India.
        </Section>

        <Section title="10. Changes to this policy">
          If this policy changes in a material way, we'll update this screen and adjust the "last updated" date
          below.
        </Section>

        <Section title="11. Contact">
          Questions about this policy or your data: md.sabeel10@gmail.com.
        </Section>

        <Text style={styles.lastUpdated}>Last updated: September 11, 2026.</Text>
      </Card>

      <Card style={styles.linkCard}>
        <Text style={styles.linkText} onPress={() => router.push('/settings/terms')}>
          ← View Terms of Use
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
