import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';

interface DeleteAccountModalProps {
  visible: boolean;
  onDismiss: () => void;
  /** Calls services/account.ts's deleteAccount — this component only handles the confirmation UI. */
  onConfirm: (password: string) => Promise<void>;
}

const CONFIRM_PHRASE = 'DELETE';

export function DeleteAccountModal({ visible, onDismiss, onConfirm }: DeleteAccountModalProps) {
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canConfirm = password.length > 0 && confirmText.trim().toUpperCase() === CONFIRM_PHRASE;

  function reset() {
    setPassword('');
    setConfirmText('');
    setError(null);
  }

  async function handleConfirm() {
    if (!canConfirm) return;
    setLoading(true);
    setError(null);
    try {
      await onConfirm(password);
      reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={() => {
        reset();
        onDismiss();
      }}
    >
      <View style={styles.backdrop}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            if (!loading) {
              reset();
              onDismiss();
            }
          }}
        />
        <View style={styles.sheet}>
          <SafeAreaView edges={['bottom']}>
            <View style={styles.handle} />

            <View style={styles.iconWrap}>
              <Feather name="alert-triangle" size={24} color={theme.colors.error} />
            </View>
            <Text style={styles.title}>Delete your account?</Text>
            <Text style={styles.body}>
              This permanently deletes your CalHow profile, meals, and weight history, and removes your login. This
              cannot be undone.
            </Text>

            <View style={styles.form}>
              <Input label="Confirm your password" icon="lock" placeholder="Current password" value={password} onChangeText={setPassword} isPassword />
              <Input
                label={`Type ${CONFIRM_PHRASE} to confirm`}
                icon="edit-3"
                placeholder={CONFIRM_PHRASE}
                value={confirmText}
                onChangeText={setConfirmText}
                autoCapitalize="characters"
              />
            </View>

            {error && (
              <View style={styles.errorBanner}>
                <Feather name="alert-circle" size={14} color={theme.colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.buttonRow}>
              <Button
                label="Cancel"
                variant="outline"
                icon={null}
                onPress={() => {
                  reset();
                  onDismiss();
                }}
                disabled={loading}
                style={{ flex: 1 }}
              />
              <Button
                label="Delete Permanently"
                variant="danger-ghost"
                icon={null}
                onPress={handleConfirm}
                loading={loading}
                disabled={!canConfirm}
                style={[styles.deleteButton, { flex: 1 }]}
              />
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: theme.palette.overlay,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.border,
    marginBottom: theme.spacing.md,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.errorBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  title: {
    ...theme.text.sectionHeading,
    color: theme.colors.textPrimary,
  },
  body: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  form: {
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.errorBg,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  errorText: {
    ...theme.text.caption,
    color: theme.colors.error,
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
  deleteButton: {
    backgroundColor: theme.colors.errorBg,
    borderRadius: theme.radius.pill,
  },
});
