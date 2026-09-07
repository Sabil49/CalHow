import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';

export interface ProgressStep {
  key: string;
  label: string;
}

interface ProgressStepsProps {
  steps: ProgressStep[];
  /** 0-based index of the step currently active. */
  currentIndex: number;
  /**
   * 'dot' (default): complete = filled check, current = hollow green ring,
   * upcoming = small gray dot. Used by the scan flow (Scan -> AI Analyzing
   * -> Clarify -> Review -> Result).
   *
   * 'numbered': complete = filled check, current AND upcoming show their
   * step digit — current on a solid green circle, upcoming on gray. Used
   * by onboarding (Goal Setup -> Personal Details -> Target Setup ->
   * Almost Done).
   */
  variant?: 'dot' | 'numbered';
}

/**
 * Step indicator used for onboarding and the scan flow — see `variant`
 * above for how the two contexts render differently.
 */
export function ProgressSteps({ steps, currentIndex, variant = 'dot' }: ProgressStepsProps) {
  return (
    <View style={styles.row}>
      {steps.map((step, index) => {
        const isComplete = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isLast = index === steps.length - 1;

        return (
          <React.Fragment key={step.key}>
            <View style={styles.stepColumn}>
              <View
                style={[
                  styles.node,
                  isComplete && styles.nodeComplete,
                  isCurrent && (variant === 'numbered' ? styles.nodeCurrentNumbered : styles.nodeCurrent),
                ]}
              >
                {isComplete ? (
                  <Feather name="check" size={14} color={theme.colors.textInverse} />
                ) : variant === 'numbered' ? (
                  <Text style={[styles.nodeNumber, isCurrent && styles.nodeNumberCurrent]}>
                    {index + 1}
                  </Text>
                ) : (
                  <View style={[styles.nodeDot, isCurrent && styles.nodeDotCurrent]} />
                )}
              </View>
              <Text
                style={[
                  styles.label,
                  (isCurrent || isComplete) && styles.labelActive,
                ]}
                numberOfLines={1}
              >
                {step.label}
              </Text>
            </View>
            {!isLast && (
              <View style={[styles.connector, isComplete && styles.connectorComplete]} />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const NODE_SIZE = 28;

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  stepColumn: {
    alignItems: 'center',
    gap: theme.spacing.xxs,
    width: 64,
  },
  node: {
    width: NODE_SIZE,
    height: NODE_SIZE,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.palette.ink100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeComplete: {
    backgroundColor: theme.colors.brandPrimary,
  },
  nodeCurrent: {
    backgroundColor: theme.colors.card,
    borderWidth: 2,
    borderColor: theme.colors.brandPrimary,
  },
  nodeCurrentNumbered: {
    backgroundColor: theme.colors.brandPrimary,
  },
  nodeNumber: {
    ...theme.text.caption,
    fontSize: 12,
    fontFamily: theme.fontFamily.sansSemiBold,
    color: theme.colors.textSecondary,
  },
  nodeNumberCurrent: {
    color: theme.colors.textInverse,
  },
  nodeDot: {
    width: 8,
    height: 8,
    borderRadius: theme.radius.pill,
    backgroundColor: theme.colors.textInverse,
  },
  nodeDotCurrent: {
    backgroundColor: theme.colors.brandPrimary,
  },
  connector: {
    flex: 1,
    height: 2,
    backgroundColor: theme.palette.ink100,
    marginTop: NODE_SIZE / 2 - 1,
    marginHorizontal: -theme.spacing.xs,
  },
  connectorComplete: {
    backgroundColor: theme.colors.brandPrimary,
  },
  label: {
    ...theme.text.caption,
    fontSize: 11,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  labelActive: {
    color: theme.colors.brandDark,
    fontFamily: theme.fontFamily.sansSemiBold,
  },
});
