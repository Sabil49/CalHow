import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { CalHowLogo } from '@/components/ui/CalHowLogo';
import { FoodHeroImage } from '@/components/ui/FoodHeroImage';
import { PrivacyNote } from '@/components/ui/PrivacyNote';
import { theme } from '@/constants/theme';

const FEATURES: { icon: keyof typeof Feather.glyphMap; tint: string; title: string; description: string }[] = [
  {
    icon: 'crop',
    tint: theme.palette.lime50,
    title: 'Scan Food Instantly',
    description: 'Use AI to detect and analyze your meals.',
  },
  {
    icon: 'zap',
    tint: theme.colors.warningBg,
    title: 'Track with Clarity',
    description: 'Understand calories and macros in a simple way.',
  },
  {
    icon: 'trending-up',
    tint: '#EEE9FB',
    title: 'See Real Progress',
    description: 'Insights and trends to help you reach your goals.',
  },
];

export default function WelcomeScreen() {
  return (
    <ScreenContainer edges={['top', 'bottom']}>
      <CalHowLogo markSize={24} textSize={theme.fontSize.lg} style={styles.logoRow} />

      <Text style={styles.heading}>
        Welcome to{'\n'}
        <Text style={styles.headingAccent}>CalHow</Text>
      </Text>
      <Text style={styles.subtitle}>
        Your AI-powered nutrition coach that helps you understand calories and build healthier
        habits.
      </Text>

      <View style={styles.body}>
        <View style={styles.featureList}>
          {FEATURES.map((feature) => (
            <View key={feature.title} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: feature.tint }]}>
                <Feather name={feature.icon} size={18} color={theme.colors.brandDark} />
              </View>
              <View style={styles.featureText}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        <FoodHeroImage size={140} style={styles.hero} />
      </View>

      <View style={styles.actions}>
        <Button label="Get Started" onPress={() => router.push('/(auth)/social-login')} />
        <Button
          label="I already have an account"
          variant="outline"
          icon={null}
          onPress={() => router.push('/(auth)/login')}
        />
        <PrivacyNote text="Your data is secure. We respect your privacy." />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  logoRow: {
    marginTop: theme.spacing.md,
  },
  heading: {
    ...theme.text.displayHeading,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xl,
  },
  headingAccent: {
    color: theme.colors.brandPrimary,
  },
  subtitle: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.md,
    maxWidth: '90%',
  },
  body: {
    flexDirection: 'row',
    marginTop: theme.spacing['2xl'],
    gap: theme.spacing.md,
  },
  featureList: {
    flex: 1,
    gap: theme.spacing.lg,
  },
  featureRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  featureDescription: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  hero: {
    marginTop: theme.spacing.xxs,
  },
  actions: {
    marginTop: theme.spacing['2xl'],
    gap: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
});
