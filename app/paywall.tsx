import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PACKAGE_TYPE, type PurchasesPackage } from 'react-native-purchases';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { AuthGuard } from '@/components/navigation/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useUserProfile } from '@/hooks/useUserProfile';
import { usePurchases } from '@/hooks/usePurchases';
import { describeFreeTrial, describePackagePrice } from '@/utils/purchaseDisplay';
import { SHOW_COMING_SOON_FEATURES } from '@/constants/featureFlags';
import { theme } from '@/constants/theme';

const HIGHLIGHTS: { icon: keyof typeof Feather.glyphMap; title: string; subtitle: string }[] = [
  { icon: 'trending-up', title: 'Smarter tracking', subtitle: 'Better results' },
  { icon: 'target', title: 'Personalized', subtitle: 'for you' },
  { icon: 'repeat', title: 'Unlimited', subtitle: 'AI scans' },
];

/**
 * `live: false` entries are V2 features that don't exist in this codebase
 * yet. For the V1 App Store build they're filtered out of the rendered
 * list entirely (see PRO_FEATURES.filter below) rather than shown — Apple
 * rejected an earlier build (Guideline 2.2) for a paywall listing features
 * as "Coming soon". The array itself is kept as-is so V2 only needs to
 * flip each feature's `live` flag as it ships; setting
 * SHOW_COMING_SOON_FEATURES back to true also brings back the old
 * dimmed/"Coming soon" badge treatment for in-progress internal builds.
 */
const PRO_FEATURES: { icon: keyof typeof Feather.glyphMap; title: string; description: string; live: boolean }[] = [
  { icon: 'repeat', title: 'Unlimited AI Food Scans', description: 'Scan as many meals as you want, anytime, without daily limits.', live: true },
  { icon: 'cpu', title: 'Smart Meal Memory', description: 'CalHow remembers your corrections, portions and foods to give better results over time.', live: false },
  { icon: 'zap', title: 'AI Meal Insights', description: 'Get deeper AI analysis and personalized nutrition insights for every meal.', live: false },
  { icon: 'bar-chart-2', title: 'Advanced Progress Analytics', description: 'Explore detailed charts, trends and correlations to understand your journey better.', live: false },
  { icon: 'crop', title: 'Restaurant & Menu Scanner', description: 'Scan restaurant menus or meals and get calorie and macro estimates instantly.', live: false },
  { icon: 'star', title: 'What Should I Eat Next?', description: 'Get smart food recommendations based on your remaining calories and goals.', live: false },
  { icon: 'sliders', title: 'Custom Goals & Macros', description: 'Set personalized calorie, macro and nutrient goals that fit your lifestyle.', live: true },
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
  const { error: purchasesError, isPro, customerInfo, offering, loading: purchasesLoading, purchase, restore, refresh } = usePurchases();
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  const packages = [offering?.annual, offering?.monthly].filter((p): p is PurchasesPackage => p != null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selectedPackage = packages.find((p) => p.identifier === selectedId) ?? packages[0] ?? null;

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

  async function handleSubscribe() {
    if (!selectedPackage || purchasingId) return;
    setPurchasingId(selectedPackage.identifier);
    try {
      const outcome = await purchase(selectedPackage);
      if (outcome.success) {
        // router.back() must run from the alert's own button callback, not
        // right after Alert.alert() — Alert.alert() returns immediately
        // without waiting for the user to dismiss it, so navigating away
        // while the native alert is still being presented on this screen
        // is unreliable on iOS and silently drops the navigation, leaving
        // the user stuck on this screen (now showing "You're already on
        // CalHow Pro!" since isPro flipped true) instead of going back.
        Alert.alert('Welcome to CalHow Pro', 'Your subscription is now active.', [
          { text: 'OK', onPress: () => router.back() },
        ]);
      } else if (!outcome.userCancelled) {
        Alert.alert('Purchase failed', 'Something went wrong completing your purchase. Please try again.');
      }
    } catch (err) {
      Alert.alert('Purchase failed', err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setPurchasingId(null);
    }
  }

  async function handleRestore() {
    if (restoring) return;
    setRestoring(true);
    try {
      await restore();
      Alert.alert('Restore complete', 'Any active subscription tied to your account is now restored on this device.');
    } catch (err) {
      Alert.alert('Restore failed', err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setRestoring(false);
    }
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
            {PRO_FEATURES.filter((feature) => feature.live || SHOW_COMING_SOON_FEATURES).map((feature) => (
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
            {purchasesLoading && !offering ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={theme.colors.brandDark} />
                <Text style={styles.loadingText}>Loading plans…</Text>
              </View>
            ) : packages.length === 0 ? (
              <View style={styles.loadingRow}>
                <Feather name="alert-triangle" size={16} color={theme.colors.textMuted} />
                <Text style={styles.loadingText}>Plans aren't available right now.</Text>
                <Button label="Try again" variant="outline" icon={null} onPress={refresh} />
              </View>
            ) : (
              <>
                <Text style={styles.cardTitle}>Choose your plan</Text>
                {packages.map((pkg) => {
                  const isSelected = selectedPackage?.identifier === pkg.identifier;
                  const isAnnual = pkg.packageType === PACKAGE_TYPE.ANNUAL;
                  const trial = describeFreeTrial(pkg);
                  return (
                    <Pressable
                      key={pkg.identifier}
                      onPress={() => setSelectedId(pkg.identifier)}
                      style={[styles.planRow, isSelected && styles.planRowSelected]}
                      accessibilityRole="radio"
                      accessibilityState={{ selected: isSelected }}
                    >
                      <View style={[styles.radioOuter, isSelected && styles.radioOuterSelected]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.planTitleRow}>
                          <Text style={styles.planTitle}>{isAnnual ? 'Yearly' : 'Monthly'}</Text>
                          {isAnnual && (
                            <View style={styles.bestValueBadge}>
                              <Text style={styles.bestValueText}>Best value</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.planPrice}>
                          {describePackagePrice(pkg)} / {isAnnual ? 'year' : 'month'}
                        </Text>
                        {isAnnual && pkg.product.pricePerMonthString && (
                          <Text style={styles.planSubtext}>{pkg.product.pricePerMonthString} / mo</Text>
                        )}
                        {trial && <Text style={styles.trialText}>{trial}</Text>}
                      </View>
                    </Pressable>
                  );
                })}

                <Button
                  label={
                    selectedPackage
                      ? describeFreeTrial(selectedPackage)
                        ? `Start ${describeFreeTrial(selectedPackage)}`
                        : `Subscribe — ${describePackagePrice(selectedPackage)}`
                      : 'Subscribe'
                  }
                  onPress={handleSubscribe}
                  loading={purchasingId != null}
                  disabled={!selectedPackage}
                  style={styles.subscribeButton}
                />

                <Text style={styles.legalText}>
                  Payment will be charged to your Apple ID account at confirmation of purchase. Subscriptions
                  automatically renew unless cancelled at least 24 hours before the end of the current period, and
                  your account will be charged for renewal within 24 hours before that period ends. Manage or cancel
                  anytime in your App Store account settings.
                </Text>

                <Pressable onPress={handleRestore} disabled={restoring} hitSlop={8}>
                  <Text style={styles.restoreText}>{restoring ? 'Restoring…' : 'Restore purchases'}</Text>
                </Pressable>

                <View style={styles.linksRow}>
                  <Text style={styles.linkText} onPress={() => router.push('/settings/terms')}>
                    Terms of Use
                  </Text>
                  <Text style={styles.linkDivider}>|</Text>
                  <Text style={styles.linkText} onPress={() => router.push('/settings/privacy')}>
                    Privacy Policy
                  </Text>
                </View>
              </>
            )}
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
  loadingRow: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.lg,
  },
  loadingText: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.sm,
  },
  planRowSelected: {
    borderColor: theme.colors.brandPrimary,
    backgroundColor: theme.colors.brandTint,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: theme.radius.pill,
    borderWidth: 2,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: theme.colors.brandPrimary,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brandPrimary,
  },
  planTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  planTitle: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  bestValueBadge: {
    backgroundColor: theme.colors.brandLight,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  bestValueText: {
    ...theme.text.caption,
    fontSize: 10,
    fontFamily: theme.fontFamily.sansSemiBold,
    color: theme.palette.black,
  },
  planPrice: {
    ...theme.text.body,
    color: theme.colors.textPrimary,
  },
  planSubtext: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  trialText: {
    ...theme.text.caption,
    color: theme.colors.brandDark,
    fontFamily: theme.fontFamily.sansSemiBold,
  },
  subscribeButton: {
    marginTop: theme.spacing.xs,
  },
  legalText: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  restoreText: {
    ...theme.text.caption,
    color: theme.colors.brandDark,
    textAlign: 'center',
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
