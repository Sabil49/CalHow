import React, { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Card } from '@/components/ui/Card';
import { useUserProfile } from '@/hooks/useUserProfile';
import { FREE_DAILY_SCAN_LIMIT } from '@/hooks/useFeatureGate';
import { theme } from '@/constants/theme';

const SUPPORT_EMAIL = 'md.sabeel10@gmail.com';

const FAQS: { question: string; answer: string }[] = [
  {
    question: 'How does meal scanning work?',
    answer:
      "Take or upload a photo of your meal. CalHow's AI identifies the food items and estimates portions, then calculates calories and macros. You'll get a chance to review and correct anything before it's saved.",
  },
  {
    question: 'How many scans do I get per day?',
    answer: `CalHow is currently in beta, so every account gets ${FREE_DAILY_SCAN_LIMIT} free AI scans per day (this is temporarily raised for beta testing). The count resets at midnight UTC.`,
  },
  {
    question: 'Is CalHow Pro available right now?',
    answer:
      "Not yet — CalHow Pro subscriptions are disabled during the beta, so nothing in the app can charge you. Unlimited scans and other Pro features will open up in a future release.",
  },
  {
    question: 'Can I edit what the AI detected?',
    answer:
      'Yes. On the review screen after scanning, you can edit portion sizes, add missing items, or remove anything that was detected incorrectly before confirming the meal.',
  },
  {
    question: 'Do reminders keep repeating, or do I need to set them every day?',
    answer:
      "Once you turn on a reminder in Settings → Reminders, it repeats automatically (daily for meals, weekly for your weigh-in) until you change or turn it off. You don't need to re-set it.",
  },
  {
    question: 'How do I delete my account and data?',
    answer: 'Go to Profile → Account & Data → Delete Account. This permanently removes your CalHow profile, meals, and weight history.',
  },
];

export default function HelpSupportScreen() {
  const { profile } = useUserProfile();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  function handleEmailSupport() {
    const subject = encodeURIComponent('CalHow support request');
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}`).catch(() => {
      Alert.alert('Could not open email', `Please email us directly at ${SUPPORT_EMAIL}.`);
    });
  }

  return (
    <ScreenContainer>
      <AppHeader left="back" onLeftPress={() => router.back()} showProfile avatarUrl={profile?.photoUrl} />

      <Text style={styles.heading}>Help & Support</Text>
      <Text style={styles.subtitle}>Get help with CalHow.</Text>

      <Pressable style={styles.emailCard} onPress={handleEmailSupport}>
        <View style={styles.emailIconWrap}>
          <Feather name="mail" size={18} color={theme.colors.brandDark} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.emailTitle}>Email support</Text>
          <Text style={styles.emailSubtitle}>{SUPPORT_EMAIL}</Text>
        </View>
        <Feather name="chevron-right" size={18} color={theme.colors.textMuted} />
      </Pressable>

      <Text style={styles.sectionHeading}>Frequently asked questions</Text>
      <Card style={styles.card}>
        {FAQS.map((faq, i) => {
          const open = openIndex === i;
          return (
            <View key={faq.question} style={i > 0 && styles.faqDivider}>
              <Pressable style={styles.faqRow} onPress={() => setOpenIndex(open ? null : i)}>
                <Text style={styles.faqQuestion}>{faq.question}</Text>
                <Feather name={open ? 'chevron-up' : 'chevron-down'} size={16} color={theme.colors.textMuted} />
              </Pressable>
              {open && <Text style={styles.faqAnswer}>{faq.answer}</Text>}
            </View>
          );
        })}
      </Card>
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
  emailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.md,
    marginTop: theme.spacing.xl,
    ...theme.shadows.card,
  },
  emailIconWrap: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emailTitle: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  emailSubtitle: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  sectionHeading: {
    ...theme.text.cardTitle,
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xl,
    marginBottom: theme.spacing.xs,
  },
  card: {
    gap: 0,
    marginBottom: theme.spacing.lg,
  },
  faqDivider: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing.sm,
    paddingVertical: theme.spacing.sm,
  },
  faqQuestion: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
    flex: 1,
  },
  faqAnswer: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
    paddingBottom: theme.spacing.sm,
  },
});
