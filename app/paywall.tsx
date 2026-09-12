import React from 'react';
import { Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { AuthGuard } from '@/components/navigation/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useUserProfile } from '@/hooks/useUserProfile';
import { usePurchases } from '@/hooks/usePurchases';
import { FREE_DAILY_SCAN_LIMIT } from '@/hooks/useFeatureGate';
import { theme } from '@/constants/theme';

const HIGHLIGHTS: { icon: keyof typeof Feather.glyphMap; title: string; subtitle: string }[] = [
  { icon: 'trending-up', title: 'Smarter tracking', subtitle: 'Better results' },
  { icon: 'target', title: 'Personalized', subtitle: 'for you' },
  { icon: 'shield', title: 'Ad-free', subtitle: 'experience' },
];

/**
 * `live: false` entries are V2 features that don't exist in this codebase
 * yet — shown dimmed with a "Coming soon" badge rather than hidden, so the
 * paywall doesn't misrepresent what a Pro subscriber gets today. Only
 * `live: true` features are ever actually gated/enforced anywhere (see
 * calhow-backend/services/usage — the free scan quota is the only real
 * Free/Pro difference in this backend right now).
 */
const PRO_FEATURES: { icon: keyof typeof Feather.glyphMap; title: string; description: string; live: boolean }[] = [
  { icon: 'repeat', title: 'Unlimited AI Food Scans', description: 'Scan as many meals as you want, anytime, without daily limits.', live: true },
  { icon: 'cpu', title: 'Smart Meal Memory', description: 'CalHow remembers your corrections, portions and foods to give better results over time.', live: false },
  { icon: 'zap', title: 'AI Meal Insights', description: 'Get deeper AI analysis and personalized nutrition insights for every meal.', live: false },
  { icon: 'bar-chart-2', title: 'Advanced Progress Analytics', description: 'Explore detailed charts, trends and correlations to understand your journey better.', live: false },
  { icon: 'crop', title: 'Restaurant & Menu Scanner', description: 'Scan restaurant menus or meals and get calorie and macro estimates instantly.', live: false },
  { icon: 'star', title: 'What Should I Eat Next?', description: 'Get smart food recommendations based on your remaining calories and goals.', live: false },
  { icon: 'sliders', title: 'Custom Goals & Macros', description: 'Set personalized calorie, macro and nutrient goals that fit your lifestyle.', live: false },
];

export default function PaywallScreen() {
  return (
    <AuthGuard>
      <PaywallScreenContent />
    </AuthGuard>
  );
}

function PaywallScreenContent() {
  const { profile } = useUserProfile();
  // Purchasing is disabled during beta (see the "Coming soon" card below) —
  // isPro/customerInfo are still read so an already-Pro account (e.g. an
  // internal tester with a real prior subscription) still sees accurate
  // status and can manage it, but nothing here can START a new purchase.
  const { error: purchasesError, isPro, customerInfo } = usePurchases();

  function handleManageSubscription() {
    const url = customerInfo?.managementURL;
    if (!url) {
      Alert.alert('Manage subscription', 'No active subscription found to manage on this device.');
      return;
    }
    Linking.openURL(url).catch(() => {
      Alert.alert('Could not open subscription management', 'Please manage your subscription from your device’s App Store or Play Store settings.');
    });
  }

  return (
    <ScreenContainer>
      <AppHeader left="back" onLeftPress={() => router.back()} showProfile avatarUrl={profile?.photoUrl} />

      <View style={styles.badgeRow}>
        <View style={styles.proTag}>
          <Feather name="award" size={12} color={theme.palette.black} />
          <Text style={styles.proTagText}>PRO</Text>
        </View>
      </View>

      <View style={styles.titleRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.heading}>
            CalHow <Text style={styles.headingAccent}>Pro</Text>
          </Text>
          <Text style={styles.subtitle}>Unlock powerful features and personalized insights to reach your health goals faster.</Text>
        </View>
        <LinearGradient colors={theme.gradients.gold} style={styles.crownWrap}>
          <Feather name="award" size={28} color={theme.colors.textInverse} />
        </LinearGradient>
      </View>

      <View style={styles.highlightsRow}>
        {HIGHLIGHTS.map((h) => (
          <View key={h.title} style={styles.highlightCol}>
            <Feather name={h.icon} size={16} color={theme.colors.brandDark} />
            <Text style={styles.highlightTitle}>{h.title}</Text>
            <Text style={styles.highlightSubtitle}>{h.subtitle}</Text>
          </View>
        ))}
      </View>

      {purchasesError && (
        <View style={styles.errorBanner}>
          <Feather name="alert-triangle" size={12} color={theme.colors.error} />
          <Text style={styles.errorBannerText}>{purchasesError}</Text>
        </View>
      )}

      {isPro ? (
        <Card style={styles.alreadyProCard}>
          <Feather name="check-circle" size={20} color={theme.colors.success} />
          <Text style={styles.alreadyProTitle}>You're already on CalHow Pro!</Text>
          <Button label="Manage subscription" variant="outline" icon={null} onPress={handleManageSubscription} />
        </Card>
      ) : (
        <>
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Everything in Free, plus:</Text>
            {PRO_FEATURES.map((feature) => (
              <View key={feature.title} style={[styles.featureRow, !feature.live && styles.featureRowDisabled]}>
                <View style={[styles.featureIconWrap, !feature.live && styles.featureIconWrapDisabled]}>
                  <Feather name={feature.icon} size={16} color={feature.live ? theme.colors.brandDark : theme.colors.textMuted} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.featureTitle, !feature.live && styles.featureTitleDisabled]}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
                {feature.live ? (
                  <Feather name="chevron-right" size={16} color={theme.colors.textMuted} />
                ) : (
                  <View style={styles.comingSoonBadge}>
                    <Text style={styles.comingSoonText}>Coming soon</Text>
                  </View>
                )}
              </View>
            ))}
          </Card>

          <Card style={styles.card}>
            <View style={styles.betaBadgeRow}>
              <Feather name="clock" size={14} color={theme.colors.brandDark} />
              <Text style={styles.betaTitle}>Pro subscription — Coming soon</Text>
            </View>
            <Text style={styles.betaBody}>
              CalHow Pro isn't open for purchase during the beta — nothing here will charge you. In the meantime,
              beta testers get {FREE_DAILY_SCAN_LIMIT} free AI scans a day (raised from the normal free-tier limit) so
              you can put the app through its paces.
            </Text>

            <View style={styles.linksRow}>
              <Text style={styles.linkText} onPress={() => router.push('/settings/terms')}>
                Terms of Use
              </Text>
              <Text style={styles.linkDivider}>|</Text>
              <Text style={styles.linkText} onPress={() => router.push('/settings/privacy')}>
                Privacy Policy
              </Text>
            </View>
          </Card>
        </>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  badgeRow: {
    marginTop: theme.spacing.md,
  },
  proTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.brandLight,
    borderRadius: theme.radius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
  },
  proTagText: {
    ...theme.text.caption,
    fontSize: 10,
    fontFamily: theme.fontFamily.sansBold,
    color: theme.palette.black,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    marginTop: theme.spacing.sm,
  },
  heading: {
    ...theme.text.screenHeading,
    color: theme.colors.textPrimary,
  },
  headingAccent: {
    color: theme.colors.brandPrimary,
  },
  subtitle: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  crownWrap: {
    width: 64,
    height: 64,
    borderRadius: theme.radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  highlightsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
  },
  highlightCol: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  highlightTitle: {
    ...theme.text.caption,
    fontFamily: theme.fontFamily.sansSemiBold,
    color: theme.colors.textPrimary,
  },
  highlightSubtitle: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.textSecondary,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xxs,
    backgroundColor: theme.colors.errorBg,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.md,
  },
  errorBannerText: {
    ...theme.text.caption,
    color: theme.colors.error,
    flex: 1,
  },
  alreadyProCard: {
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.lg,
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  alreadyProTitle: {
    ...theme.text.cardTitle,
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
  },
  card: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  cardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardTitle: {
    ...theme.text.cardTitle,
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  featureRowDisabled: {
    opacity: 0.55,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureIconWrapDisabled: {
    backgroundColor: theme.colors.border,
  },
  featureTitle: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  featureTitleDisabled: {
    color: theme.colors.textSecondary,
  },
  comingSoonBadge: {
    backgroundColor: theme.colors.border,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 3,
  },
  comingSoonText: {
    ...theme.text.caption,
    fontSize: 10,
    fontFamily: theme.fontFamily.sansSemiBold,
    color: theme.colors.textSecondary,
  },
  featureDescription: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  betaBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  betaTitle: {
    ...theme.text.cardTitle,
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
  },
  betaBody: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
  },
  linksRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.lg,
  },
  linkText: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.brandDark,
  },
  linkDivider: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
});
