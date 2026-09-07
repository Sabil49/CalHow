import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { DetectedFoodRow } from '@/components/meal/DetectedFoodRow';
import { EditFoodItemModal } from '@/components/meal/EditFoodItemModal';
import { useAsyncAction } from '@/hooks/useAsyncAction';
import { useScanSession } from '@/hooks/useScanSession';
import { recalculateMeal } from '@/services/api';
import { theme } from '@/constants/theme';
import type { FoodItem } from '@/types/models';

export default function ReviewScreen() {
  const { foods, setFoods, analysisId, setFinalTotals, reset } = useScanSession();
  const [editingItem, setEditingItem] = useState<FoodItem | undefined>(undefined);
  const [modalMode, setModalMode] = useState<'edit' | 'add' | null>(null);

  const averageConfidence = useMemo(() => {
    const withConfidence = foods.filter((f) => f.confidence != null);
    if (withConfidence.length === 0) return undefined;
    const sum = withConfidence.reduce((acc, f) => acc + (f.confidence ?? 0), 0);
    return Math.round((sum / withConfidence.length) * 100);
  }, [foods]);

  const { run: handleConfirm, loading, error } = useAsyncAction(async () => {
    if (!analysisId) return;
    const result = await recalculateMeal({ analysisId, foods });
    // Apply backend-authoritative foods (correct calories, consistent portionLabel)
    // before setting final totals so the saved meal is internally consistent:
    // sum(foods[].calories) === meal.calories.
    setFoods(result.foods);
    setFinalTotals(result);
    router.replace('/scan/result');
  });

  function handleDelete(id: string) {
    setFoods(foods.filter((f) => f.id !== id));
  }

  function handleSaveEdit(item: FoodItem) {
    if (modalMode === 'add') {
      setFoods([...foods, item]);
    } else {
      setFoods(foods.map((f) => (f.id === item.id ? item : f)));
    }
    setModalMode(null);
    setEditingItem(undefined);
  }

  function handleScanAgain() {
    reset();
    router.replace('/scan/camera');
  }

  return (
    <ScreenContainer>
      <AppHeader left="back" onLeftPress={() => router.back()} showProfile />

      <Text style={styles.eyebrow}>Almost there!</Text>
      <Text style={styles.heading}>
        Please review and confirm your <Text style={styles.headingAccent}>meal</Text>
      </Text>
      <Text style={styles.subtitle}>AI detected these items. Review and make any changes before we calculate nutrition.</Text>

      <View style={styles.tip}>
        <Feather name="info" size={14} color={theme.colors.brandDark} />
        <Text style={styles.tipText}>Tip: Make sure the portion sizes are close to your meal. You can edit anything.</Text>
      </View>

      <Card style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>Detected food items ({foods.length})</Text>
          {averageConfidence != null && (
            <View style={styles.confidenceBadge}>
              <Feather name="bar-chart-2" size={12} color={theme.colors.brandDark} />
              <Text style={styles.confidenceBadgeText}>Average confidence: {averageConfidence}%</Text>
            </View>
          )}
        </View>

        {foods.map((food) => (
          <DetectedFoodRow
            key={food.id}
            food={food}
            editable
            onEdit={() => {
              setEditingItem(food);
              setModalMode('edit');
            }}
            onDelete={() => handleDelete(food.id)}
          />
        ))}

        <Pressable
          style={styles.addRow}
          onPress={() => {
            setEditingItem(undefined);
            setModalMode('add');
          }}
        >
          <Feather name="plus-circle" size={16} color={theme.colors.brandDark} />
          <Text style={styles.addRowText}>Something missing? Add another item</Text>
          <Feather name="chevron-right" size={16} color={theme.colors.brandDark} style={styles.addRowChevron} />
        </Pressable>
      </Card>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.buttonRow}>
        <Button label="Scan Again" variant="outline" icon="refresh-cw" onPress={handleScanAgain} style={{ flex: 1 }} />
        <Button
          label="Confirm & Analyze"
          variant="solid"
          icon="check-circle"
          onPress={handleConfirm}
          loading={loading}
          disabled={foods.length === 0}
          style={{ flex: 1 }}
        />
      </View>

      <EditFoodItemModal
        visible={modalMode !== null}
        item={editingItem}
        onDismiss={() => {
          setModalMode(null);
          setEditingItem(undefined);
        }}
        onSave={handleSaveEdit}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  eyebrow: {
    ...theme.text.label,
    color: theme.colors.brandDark,
    marginTop: theme.spacing.xl,
  },
  heading: {
    ...theme.text.screenHeading,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xxs,
  },
  headingAccent: {
    color: theme.colors.brandPrimary,
  },
  subtitle: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.brandTint,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.md,
    marginTop: theme.spacing.md,
  },
  tipText: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
    flex: 1,
  },
  card: {
    marginTop: theme.spacing.lg,
    gap: 0,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  cardTitle: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confidenceBadgeText: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.brandDark,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
    backgroundColor: theme.colors.brandTint,
    borderRadius: theme.radius.md,
    padding: theme.spacing.sm,
    marginTop: theme.spacing.xs,
  },
  addRowText: {
    ...theme.text.caption,
    color: theme.colors.brandDark,
    fontFamily: theme.fontFamily.sansSemiBold,
  },
  addRowChevron: {
    marginLeft: 'auto',
  },
  errorText: {
    ...theme.text.caption,
    color: theme.colors.error,
    marginTop: theme.spacing.sm,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
  },
});
