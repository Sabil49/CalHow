import React, { useRef, useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { CalHowLogo } from '@/components/ui/CalHowLogo';
import { useScanSession } from '@/hooks/useScanSession';
import { theme } from '@/constants/theme';

const ZOOM_PRESETS = [
  { label: '0.5', value: 0 },
  { label: '1x', value: 0.15 },
  { label: '2', value: 0.35 },
];

export default function CameraScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [zoomIndex, setZoomIndex] = useState(1);
  const [flash, setFlash] = useState<'auto' | 'on' | 'off'>('auto');
  const [capturing, setCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const { setImage } = useScanSession();

  async function handleCapture() {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      if (photo?.base64 && photo.uri) {
        // expo-camera always produces JPEG output.
        setImage(photo.uri, photo.base64, 'image/jpeg');
        router.push('/scan/analyzing');
      }
    } catch (err) {
      Alert.alert('Couldn\u2019t take photo', err instanceof Error ? err.message : 'Please try again.');
    } finally {
      setCapturing(false);
    }
  }

  async function handlePickFromGallery() {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        base64: true,
        quality: 0.7,
      });
      if (!result.canceled && result.assets[0]?.base64) {
        const asset = result.assets[0];
        // expo-image-picker with quality < 1 converts HEIC/HEIF \u2192 JPEG on iOS.
        // PNG images are not recompressed and remain PNG. The backend accepts
        // 'image/jpeg' and 'image/png' only \u2014 reject anything else rather than
        // sending incorrect metadata to the vision API.
        const rawMime = asset.mimeType ?? '';
        if (rawMime !== 'image/jpeg' && rawMime !== 'image/png') {
          Alert.alert(
            'Unsupported image format',
            'Please choose a JPEG or PNG photo. HEIC or other formats are not supported for V1.',
          );
          return;
        }
        setImage(asset.uri, asset.base64!, rawMime);
        router.push('/scan/analyzing');
      }
    } catch (err) {
      Alert.alert('Couldn\u2019t open your photos', err instanceof Error ? err.message : 'Please try again.');
    }
  }

  function cycleFlash() {
    setFlash((f) => (f === 'auto' ? 'on' : f === 'on' ? 'off' : 'auto'));
  }

  if (!permission) {
    return <View style={styles.container} />;
  }

  if (!permission.granted) {
    const permanentlyDenied = !permission.canAskAgain;
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <Feather name="camera-off" size={40} color={theme.colors.textSecondary} />
        <Text style={styles.permissionTitle}>Camera access needed</Text>
        <Text style={styles.permissionBody}>
          {permanentlyDenied
            ? 'Camera access is turned off for CalHow. Enable it in your device settings to scan meals.'
            : 'CalHow needs your camera to scan meals and estimate their nutrition.'}
        </Text>
        {permanentlyDenied ? (
          <Button label="Open Settings" onPress={() => Linking.openSettings()} icon={null} />
        ) : (
          <Button label="Grant Camera Access" onPress={requestPermission} icon={null} />
        )}
        <Button label="Not now" variant="ghost" icon={null} onPress={() => router.back()} />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="back"
        flash={flash}
        zoom={ZOOM_PRESETS[zoomIndex].value}
      />

      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={styles.iconButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close camera"
          >
            <Feather name="x" size={20} color={theme.colors.textInverse} />
          </Pressable>
          <View style={{ flex: 1 }} />
          <CalHowLogo markSize={22} textSize={theme.fontSize.md} textColor={theme.colors.textInverse} />
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={cycleFlash}
            style={styles.flashButton}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`Flash: ${flash === 'auto' ? 'Auto' : flash === 'on' ? 'On' : 'Off'}. Double tap to change.`}
          >
            <Feather name="zap" size={16} color={theme.colors.textInverse} />
            <Text style={styles.flashLabel}>{flash === 'auto' ? 'Auto' : flash === 'on' ? 'On' : 'Off'}</Text>
          </Pressable>
        </View>

        <View style={styles.headingBlock}>
          <Text style={styles.heading}>
            Scan your <Text style={styles.headingAccent}>food</Text>
          </Text>
          <Text style={styles.subtitle}>Take a clear photo of your meal and let AI do the rest.</Text>
        </View>

        <View style={styles.viewfinder}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
          <View style={styles.tipBadge}>
            <Feather name="zap" size={12} color={theme.colors.warning} />
            <Text style={styles.tipText}>Tip: Good lighting works best</Text>
          </View>
        </View>

        <View style={styles.zoomRow}>
          {ZOOM_PRESETS.map((preset, index) => (
            <Pressable
              key={preset.label}
              onPress={() => setZoomIndex(index)}
              style={[styles.zoomChip, index === zoomIndex && styles.zoomChipActive]}
              accessibilityRole="button"
              accessibilityLabel={`Zoom ${preset.label}`}
              accessibilityState={{ selected: index === zoomIndex }}
            >
              <Text style={[styles.zoomText, index === zoomIndex && styles.zoomTextActive]}>{preset.label}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.bottomBar}>
          <Pressable onPress={handlePickFromGallery} style={styles.sideButton} accessibilityRole="button" accessibilityLabel="Choose photo from gallery">
            <Feather name="image" size={20} color={theme.colors.textInverse} />
          </Pressable>

          <Pressable
            onPress={handleCapture}
            disabled={capturing}
            style={styles.shutterOuter}
            accessibilityRole="button"
            accessibilityLabel="Take photo"
            accessibilityState={{ disabled: capturing, busy: capturing }}
          >
            <View style={styles.shutterInner} />
          </Pressable>

          <Pressable
            onPress={() => Alert.alert('Recent scans', 'Coming soon.')}
            style={styles.sideButton}
            accessibilityRole="button"
            accessibilityLabel="Recent scans"
          >
            <Feather name="clock" size={20} color={theme.colors.textInverse} />
          </Pressable>
        </View>
        <View style={styles.bottomLabels}>
          <Text style={styles.bottomLabelText}>Gallery</Text>
          <View style={{ width: 64 }} />
          <Text style={styles.bottomLabelText}>Recent</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.palette.black,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing.xl,
    gap: theme.spacing.sm,
  },
  permissionTitle: {
    ...theme.text.sectionHeading,
    color: theme.colors.textPrimary,
    marginTop: theme.spacing.sm,
  },
  permissionBody: {
    ...theme.text.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  overlay: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(0,0,0,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flashButton: {
    alignItems: 'center',
    gap: 2,
  },
  flashLabel: {
    ...theme.text.caption,
    fontSize: 10,
    color: theme.colors.textInverse,
  },
  headingBlock: {
    alignItems: 'center',
    marginTop: theme.spacing.md,
    gap: theme.spacing.xs,
  },
  heading: {
    ...theme.text.screenHeading,
    color: theme.colors.textInverse,
  },
  headingAccent: {
    color: theme.colors.brandLight,
  },
  subtitle: {
    ...theme.text.body,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  viewfinder: {
    flex: 1,
    marginVertical: theme.spacing.lg,
    justifyContent: 'flex-end',
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: theme.colors.textInverse,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 8 },
  cornerTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 8 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 8 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 8 },
  tipBadge: {
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xxs,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    marginBottom: theme.spacing.md,
  },
  tipText: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.textInverse,
  },
  zoomRow: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: theme.radius.pill,
    padding: 3,
    gap: 2,
  },
  zoomChip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 6,
    borderRadius: theme.radius.pill,
  },
  zoomChipActive: {
    backgroundColor: theme.colors.textInverse,
  },
  zoomText: {
    ...theme.text.caption,
    color: theme.colors.textInverse,
  },
  zoomTextActive: {
    color: theme.palette.black,
    fontFamily: theme.fontFamily.sansSemiBold,
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: theme.spacing.lg,
    paddingHorizontal: theme.spacing.lg,
  },
  sideButton: {
    width: 56,
    height: 56,
    borderRadius: theme.radius.pill,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterOuter: {
    width: 76,
    height: 76,
    borderRadius: theme.radius.pill,
    borderWidth: 3,
    borderColor: theme.colors.brandLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 60,
    height: 60,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.textInverse,
  },
  bottomLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.lg + 8,
    marginTop: theme.spacing.xs,
  },
  bottomLabelText: {
    ...theme.text.caption,
    color: theme.colors.textInverse,
    width: 56,
    textAlign: 'center',
  },
});
