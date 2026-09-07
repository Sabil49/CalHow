import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { PurchasesPackage } from 'react-native-purchases';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { AuthGuard } from '@/components/navigation/AuthGuard';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useUserProfile } from '@/hooks/useUserProfile';
import { usePurchases } from '@/hooks/usePurchases';
import { describeFreeTrial, describePackagePrice } from '@/utils/purchaseDisplay';
import { theme } from '@/constants/theme';

type PlanId = 'monthly' | 'yearly';

const HIGHLIGHTS: { icon: keyof typeof Feather.glyphMap; title: string; subtitle: string }[] = [
  { icon: 'trending-up', title: 'Smarter tracking', subtitle: 'Better results' },
  { icon: 'target', title: 'Personalized', subtitle: 'for you' },
  { icon: 'shield', title: 'Ad-free', subtitle: 'experience' },
];

const PRO_FEATURES: { icon: keyof typeof Feather.glyphMap; title: string; description: string }[] = [
  { icon: 'repeat', title: 'Unlimited AI Food Scans', description: 'Scan as many meals as you want, anytime, without daily limits.' },
  { icon: 'cpu', title: 'Smart Meal Memory', description: 'CalHow remembers your corrections, portions and foods to give better results over time.' },
  { icon: 'zap', title: 'AI Meal Insights', description: 'Get deeper AI analysis and personalized nutrition insights for every meal.' },
  { icon: 'bar-chart-2', title: 'Advanced Progress Analytics', description: 'Explore detailed charts, trends and correlations to understand your journey better.' },
  { icon: 'crop', title: 'Restaurant & Menu Scanner', description: 'Scan restaurant menus or meals and get calorie and macro estimates instantly.' },
  { icon: 'star', title: 'What Should I Eat Next?', description: 'Get smart food recommendations based on your remaining calories and goals.' },
  { icon: 'sliders', title: 'Custom Goals & Macros', description: 'Set personalized calorie, macro and nutrient goals that fit your lifestyle.' },
];

/**
 * Fallback-only copy, shown while live RevenueCat offerings are still
 * loading or if they failed to load — never used once real package data
 * is available. See usePlanCards() below, and services/purchases.ts's
 * "NO HARDCODED PRICES" doc comment for why this exists only as a
 * placeholder, not a source of truth.
 */
const FALLBACK_PLANS: Record<PlanId, { label: string; price: string; billing: string; badge?: string }> = {
  yearly: { label: 'Yearly', price: '$49.99', billing: '/ year • $4.17 / month', badge: 'Save 50%' },
  monthly: { label: 'Monthly', price: '$7.99', billing: '/ month • Billed monthly' },
};

interface PlanCard {
  id: PlanId;
  label: string;
  priceText: string;
  billingText: string;
  badge?: string;
  pkg: PurchasesPackage | null;
}

/** Combines live offering packages with fallback copy — see FALLBACK_PLANS above. */
function usePlanCards(): PlanCard[] {
  const { offering } = usePurchases();

  return useMemo(() => {
    const monthlyPkg = offering?.monthly ?? null;
    const yearlyPkg = offering?.annual ?? null;

    let badge: string | undefined = monthlyPkg && yearlyPkg ? undefined : FALLBACK_PLANS.yearly.badge;
    let yearlyBilling = FALLBACK_PLANS.yearly.billing;
    if (yearlyPkg?.product.pricePerMonthString) {
      yearlyBilling = `/ year • ${yearlyPkg.product.pricePerMonthString} / month`;
      if (monthlyPkg && yearlyPkg.product.pricePerMonth != null && monthlyPkg.product.price > 0) {
        const savingsPercent = Math.round((1 - yearlyPkg.product.pricePerMonth / monthlyPkg.product.price) * 100);
        if (savingsPercent > 0) badge = `Save ${savingsPercent}%`;
      }
    }

    return [
      {
        id: 'yearly',
        label: FALLBACK_PLANS.yearly.label,
        priceText: yearlyPkg ? describePackagePrice(yearlyPkg) : FALLBACK_PLANS.yearly.price,
        billingText: yearlyBilling,
        badge,
        pkg: yearlyPkg,
      },
      {
        id: 'monthly',
        label: FALLBACK_PLANS.monthly.label,
        priceText: monthlyPkg ? describePackagePrice(monthlyPkg) : FALLBACK_PLANS.monthly.price,
        billingText: FALLBACK_PLANS.monthly.billing,
        pkg: monthlyPkg,
      },
    ];
  }, [offering]);
}

export default function PaywallScreen() {
  return (
    <AuthGuard>
      <PaywallScreenContent />
    </AuthGuard>
  );
}

function PaywallScreenContent() {
  const { profile } = useUserProfile();
  const { loading, error: purchasesError, isPro, customerInfo, purchase, restore } = usePurchases();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>('yearly');
  const planCards = usePlanCards();

  const selectedCard = planCards.find((p) => p.id === selectedPlan) ?? planCards[0]!;
  // Fallback trial copy only while the real package hasn't loaded yet — once it has, describeFreeTrial's
  // real (possibly null, meaning "no trial") result is used, never overridden by this placeholder.
  const trialText = selectedCard.pkg ? describeFreeTrial(selectedCard.pkg) : '7-day free trial';

  const { run: handlePurchase, loading: purchasing } = useAsyncAction(async () => {
    if (!selectedCard.pkg) {
      Alert.alert('Not available yet', 'Plans are still loading — please try again in a moment.');
      return;
    }
    try {
      const outcome = await purchase(selectedCard.pkg);
      if (!outcome.success && !outcome.userCancelled) {
        Alert.alert('Purchase failed', 'Something went wrong completing your purchase. Please try again.');
      }
      // userCancelled: stay silent — the user backed out on purpose.
      // success: isPro flips reactively via CustomerInfo, re-rendering this screen into the "already Pro" state below.
    } catch (err) {
      Alert.alert('Purchase failed', err instanceof Error ? err.message : 'Please try again later.');
    }
  });

  const { run: handleRestore, loading: restoring } = useAsyncAction(async () => {
    try {
      await restore();
      Alert.alert(
        isPro ? 'Purchases restored' : 'No active subscription found',
        isPro ? "You're all set — CalHow Pro is now active on this device." : "We couldn't find an active CalHow Pro subscription for this account.",
      );
    } catch (err) {
      Alert.alert('Restore failed', err instanceof Error ? err.message : 'Please try again later.');
    }
  });

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
              <View key={feature.title} style={styles.featureRow}>
                <View style={styles.featureIconWrap}>
                  <Feather name={feature.icon} size={16} color={theme.colors.brandDark} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.featureTitle}>{feature.title}</Text>
                  <Text style={styles.featureDescription}>{feature.description}</Text>
                </View>
                <Feather name="chevron-right" size={16} color={theme.colors.textMuted} />
              </View>
            ))}
          </Card>

          <Card style={styles.card}>
            <View style={styles.cardTitleRow}>
              <Text style={styles.cardTitle}>Choose your plan</Text>
              {loading && <ActivityIndicator size="small" color={theme.colors.brandPrimary} />}
            </View>
            <View style={styles.planRow}>
              {planCards.map((plan) => {
                const selected = selectedPlan === plan.id;
                return (
                  <Pressable
                    key={plan.id}
                    onPress={() => setSelectedPlan(plan.id)}
                    style={[styles.planCard, selected && styles.planCardSelected]}
                  >
                    {selected && (
                      <View style={styles.planCheck}>
                        <Feather name="check" size={10} color={theme.colors.textInverse} />
                      </View>
                    )}
                    <View style={styles.planLabelRow}>
                      <Text style={styles.planLabel}>{plan.label}</Text>
                      {plan.badge && (
                        <View style={styles.planBadge}>
                          <Text style={styles.planBadgeText}>{plan.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.planPrice}>{plan.priceText}</Text>
                    <Text style={styles.planBilling}>{plan.billingText}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.trustRow}>
              <Feather name="shield" size={12} color={theme.colors.textSecondary} />
              <Text style={styles.trustText}>
                {trialText ? `${trialText} • ` : ''}Cancel anytime • Secure payment
              </Text>
            </View>

            <Button
              label={trialText ? 'Start Free Trial' : 'Subscribe Now'}
              icon="award"
              onPress={handlePurchase}
              loading={purchasing}
              disabled={loading && !selectedCard.pkg}
            />

            <View style={styles.linksRow}>
              <Text style={styles.linkText} onPress={restoring ? undefined : handleRestore}>
                {restoring ? 'Restoring…' : 'Restore Purchase'}
              </Text>
              <Text style={styles.linkDivider}>|</Text>
              <Text style={styles.linkText} onPress={() => Alert.alert('Terms of Use', 'Coming soon.')}>
                Terms of Use
              </Text>
              <Text style={styles.linkDivider}>|</Text>
              <Text style={styles.linkText} onPress={() => Alert.alert('Privacy Policy', 'Coming soon.')}>
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
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureTitle: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  featureDescription: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  planRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  planCard: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    gap: 2,
  },
  planCardSelected: {
    borderColor: theme.colors.brandPrimary,
    backgroundColor: theme.colors.brandTint,
  },
  planCheck: {
    position: 'absolute',
    top: theme.spacing.xs,
    right: theme.spacing.xs,
    width: 16,
    height: 16,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  planLabel: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  planBadge: {
    backgroundColor: theme.colors.successBg,
    borderRadius: theme.radius.pill,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  planBadgeText: {
    ...theme.text.caption,
    fontSize: 9,
    color: theme.colors.success,
    fontFamily: theme.fontFamily.sansSemiBold,
  },
  planPrice: {
    fontFamily: theme.fontFamily.serifBold,
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
    marginTop: 2,
  },
  planBilling: {
    ...theme.text.caption,
    fontSize: 10,
    color: theme.colors.textSecondary,
  },
  trustRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  trustText: {
    ...theme.text.caption,
    fontSize: 11,
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
