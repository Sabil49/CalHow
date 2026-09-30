import React, { useState } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { AppHeader } from '@/components/navigation/AppHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ProLockedCard } from '@/components/ui/ProLockedCard';
import { useFeatureGate } from '@/hooks/useFeatureGate';
import { useScanSession } from '@/hooks/useScanSession';
import { scanMenu, ApiError } from '@/services/api';
import { theme } from '@/constants/theme';
import type { ScanMenuDish } from '@/types/api';

type Phase = 'pick' | 'scanning' | 'results';

/**
 * CalHow Pro "Restaurant & Menu Scanner". The backend reads the menu photo
 * and estimates each dish with the same USDA-based pipeline as a meal
 * scan; logging a dish hands its analysis to the normal Review -> Result
 * flow, exactly like a scanned meal (minus the photo).
 */
export default function MenuScanScreen() {
  const isPro = useFeatureGate('restaurantMenuScanner');
  const { reset, setAnalysis } = useScanSession();
  const [phase, setPhase] = useState<Phase>('pick');
  const [dishes, setDishes] = useState<ScanMenuDish[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function pickImage(source: 'camera' | 'library') {
    setError(null);
    try {
      if (source === 'camera') {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) {
          Alert.alert('Camera access needed', 'Allow camera access in Settings to photograph a menu, or choose a photo instead.', [
            { text: 'Not now', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() },
          ]);
          return;
        }
      }
      const options: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], base64: true, quality: 0.7 };
      const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
      const asset = result.assets?.[0];
      if (result.canceled || !asset?.base64) return;

      const mimeType = asset.mimeType ?? 'image/jpeg';
      if (mimeType !== 'image/jpeg' && mimeType !== 'image/png') {
        Alert.alert('Unsupported image format', 'Please choose a JPEG or PNG photo.');
        return;
      }

      setPhase('scanning');
      const response = await scanMenu({ imageBase64: asset.base64, mimeType });
      setDishes(response.dishes);
      setPhase('results');
    } catch (err) {
      setPhase('pick');
      if (err instanceof ApiError && err.code === 'pro_required') {
        setError("We couldn't confirm your CalHow Pro subscription. Try Restore Purchases on the Pro screen.");
      } else {
        setError(err instanceof ApiError ? err.message : "Couldn't read the menu. Please try again.");
      }
    }
  }

  function handleLog(dish: ScanMenuDish) {
    if (!dish.analysisId || !dish.prediction) return;
    reset();
    setAnalysis({ analysisId: dish.analysisId, prediction: dish.prediction, clarificationQuestions: dish.clarificationQuestions });
    router.push(dish.needsClarification ? '/scan/clarify' : '/scan/review');
  }

  return (
    <ScreenContainer>
      <AppHeader left="back" onLeftPress={() => router.back()} />

      <Text style={styles.heading}>
        Restaurant & <Text style={styles.headingAccent}>Menu Scanner</Text>
      </Text>
      <Text style={styles.subtitle}>Photograph a menu to see estimated calories and macros for each dish before you order.</Text>

      {!isPro ? (
        <ProLockedCard
          icon="book-open"
          title="Menu Scanner"
          description="Scan a restaurant menu and get calorie and macro estimates for each dish — then log what you order in one tap."
        />
      ) : phase === 'scanning' ? (
        <Card style={styles.card}>
          <View style={styles.scanning}>
            <ActivityIndicator color={theme.colors.brandPrimary} />
            <Text style={styles.scanningTitle}>Reading the menu…</Text>
            <Text style={styles.muted}>Estimating each dish. This can take up to a minute.</Text>
          </View>
        </Card>
      ) : phase === 'results' ? (
        <>
          {dishes.map((dish, index) => (
            <Card key={`${dish.name}-${index}`} style={styles.card}>
              <Text style={styles.dishName}>{dish.name}</Text>
              {dish.description ? <Text style={styles.muted}>{dish.description}</Text> : null}
              {dish.prediction ? (
                <>
                  <View style={styles.macroRow}>
                    <Text style={styles.kcal}>≈ {Math.round(dish.prediction.calories).toLocaleString()} kcal</Text>
                    <Text style={styles.macros}>
                      P {Math.round(dish.prediction.protein)} g · C {Math.round(dish.prediction.carbs)} g · F {Math.round(dish.prediction.fats)} g
                    </Text>
                  </View>
                  <Text style={styles.components} numberOfLines={2}>
                    Typical serving: {dish.prediction.foods.map((f) => `${f.name} (${f.portionLabel})`).join(', ')}
                  </Text>
                  <Button label="Log this dish" icon="plus" variant="outline" onPress={() => handleLog(dish)} />
                </>
              ) : (
                <Text style={styles.unavailable}>{dish.unavailableReason ?? "Couldn't estimate this dish."}</Text>
              )}
            </Card>
          ))}
          <Text style={styles.footnote}>
            Estimates assume a typical restaurant serving, with nutrition from USDA FoodData Central. Restaurant portions and
            recipes vary — you can adjust items before saving.
          </Text>
          <Button label="Scan another menu" icon="camera" variant="ghost" onPress={() => setPhase('pick')} style={styles.again} />
        </>
      ) : (
        <Card style={styles.card}>
          <View style={styles.pickIcon}>
            <Feather name="book-open" size={22} color={theme.colors.brandDark} />
          </View>
          <Text style={styles.muted}>Fit the dishes you're interested in into the photo, in good light.</Text>
          <Button label="Take a Photo" icon="camera" onPress={() => pickImage('camera')} />
          <Button label="Choose from Photos" icon="image" variant="outline" onPress={() => pickImage('library')} />
          {error && <Text style={styles.error}>{error}</Text>}
        </Card>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  heading: {
    ...theme.text.screenHeading,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.xl,
  },
  headingAccent: {
    color: theme.colors.brandPrimary,
  },
  subtitle: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
    marginTop: theme.spacing.xs,
  },
  card: {
    marginTop: theme.spacing.lg,
    gap: theme.spacing.sm,
  },
  scanning: {
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingVertical: theme.spacing.lg,
  },
  scanningTitle: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  muted: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  pickIcon: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.brandTint,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  dishName: {
    ...theme.text.cardTitle,
    color: theme.colors.textPrimary,
  },
  macroRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: theme.spacing.xs,
  },
  kcal: {
    fontFamily: theme.fontFamily.sansBold,
    fontSize: theme.fontSize.lg,
    color: theme.colors.brandDark,
  },
  macros: {
    ...theme.text.caption,
    color: theme.colors.textSecondary,
  },
  components: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.textMuted,
  },
  unavailable: {
    ...theme.text.caption,
    color: theme.colors.textMuted,
  },
  error: {
    ...theme.text.caption,
    color: theme.colors.error,
  },
  footnote: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: theme.spacing.md,
  },
  again: {
    marginTop: theme.spacing.sm,
    marginBottom: theme.spacing.lg,
  },
});
