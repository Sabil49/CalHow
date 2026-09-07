import React, { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';
import type { FoodItem } from '@/types/models';

interface EditFoodItemModalProps {
  visible: boolean;
  /** Pass an existing item to edit it, or omit to add a new one. */
  item?: FoodItem;
  onDismiss: () => void;
  onSave: (item: FoodItem) => void;
}

/**
 * `portionGrams` is the canonical numeric quantity the backend uses to
 * recalculate real nutrition (name + grams -> USDA lookup -> deterministic
 * scaling — see calhow-backend's recalculate route). `portionLabel` is
 * just what's displayed in lists; it's derived from grams by default here
 * so the two can't silently drift apart, though it remains editable for
 * cases like "1/2 avocado" that read better than a bare gram figure.
 *
 * Previously this modal only collected portionLabel/calories and dropped
 * `portionGrams` entirely on save — meaning any edited or manually added
 * food lost its grams, and the backend had to fall back to parsing a
 * number out of the label text (still supported as a defensive fallback,
 * but no longer the normal path).
 */
export function EditFoodItemModal({ visible, item, onDismiss, onSave }: EditFoodItemModalProps) {
  const [name, setName] = useState(item?.name ?? '');
  const [portionGrams, setPortionGrams] = useState(item?.portionGrams != null ? String(item.portionGrams) : '');
  const [portionLabel, setPortionLabel] = useState(item?.portionLabel ?? '');
  const [calories, setCalories] = useState(item?.calories != null ? String(item.calories) : '');

  useEffect(() => {
    if (visible) {
      setName(item?.name ?? '');
      setPortionGrams(item?.portionGrams != null ? String(item.portionGrams) : '');
      setPortionLabel(item?.portionLabel ?? '');
      setCalories(item?.calories != null ? String(item.calories) : '');
    }
  }, [visible, item]);

  const gramsValue = Number(portionGrams);
  const gramsValid = portionGrams.trim().length > 0 && gramsValue > 0;
  const canSave = name.trim().length > 0 && gramsValid && Number(calories) >= 0;

  function handleSave() {
    if (!canSave) return;
    const trimmedLabel = portionLabel.trim();
    onSave({
      id: item?.id ?? `manual-${Date.now()}`,
      name: name.trim(),
      portionGrams: gramsValue,
      // Falls back to a grams-derived label if the user didn't type a
      // custom one — portionLabel is always present for display, but
      // never the source of truth (portionGrams is).
      portionLabel: trimmedLabel.length > 0 ? trimmedLabel : `${gramsValue} g`,
      calories: Number(calories) || 0,
      confidence: item?.confidence,
      imageUrl: item?.imageUrl,
    });
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onDismiss}>
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <SafeAreaView edges={['bottom']}>
            <View style={styles.handle} />
            <View style={styles.headerRow}>
              <Text style={styles.title}>{item ? 'Edit food item' : 'Add a food item'}</Text>
              <Pressable onPress={onDismiss} hitSlop={8}>
                <Feather name="x" size={20} color={theme.colors.textSecondary} />
              </Pressable>
            </View>

            <View style={styles.form}>
              <Input label="Food name" icon="tag" placeholder="e.g. Grilled Chicken" value={name} onChangeText={setName} />
              <Input
                label="Portion (grams)"
                icon="hash"
                placeholder="e.g. 150"
                value={portionGrams}
                onChangeText={setPortionGrams}
                keyboardType="decimal-pad"
                rightAdornment={<Text style={styles.unitSuffix}>g</Text>}
              />
              <Input
                label="Portion label (optional)"
                icon="package"
                placeholder={gramsValid ? `Defaults to "${gramsValue} g"` : 'e.g. 1 cup, 1/2 avocado'}
                value={portionLabel}
                onChangeText={setPortionLabel}
              />
              <Input label="Calories" icon="zap" placeholder="e.g. 165" value={calories} onChangeText={setCalories} keyboardType="number-pad" />
            </View>

            <View style={styles.note}>
              <Feather name="info" size={13} color={theme.colors.brandDark} />
              <Text style={styles.noteText}>Portion in grams is what we use to recalculate nutrition accurately.</Text>
            </View>

            <Button label={item ? 'Save changes' : 'Add item'} onPress={handleSave} disabled={!canSave} icon={null} />
          </SafeAreaView>
        </Pressable>
      </Pressable>
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
    marginBottom: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.text.cardTitle,
    fontSize: theme.fontSize.lg,
    color: theme.colors.textPrimary,
  },
  form: {
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.sm,
  },
  unitSuffix: {
    ...theme.text.label,
    color: theme.colors.textMuted,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.brandTint,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
  noteText: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
    flex: 1,
  },
});
