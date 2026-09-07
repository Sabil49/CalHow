import type { Feather } from '@expo/vector-icons';
import { theme } from '@/constants/theme';
import type { ActivityLevel, GoalType } from '@/types/models';

export interface GoalOption {
  value: GoalType;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
}

export const GOAL_OPTIONS: GoalOption[] = [
  { value: 'lose_weight', title: 'Lose Weight', description: 'Create a calorie deficit and lose weight in a healthy way.', icon: 'target', color: theme.colors.brandDark },
  { value: 'maintain_weight', title: 'Maintain Weight', description: 'Maintain your current weight with a balanced lifestyle.', icon: 'activity', color: '#E0A233' },
  { value: 'build_muscle', title: 'Build Muscle', description: 'Gain lean muscle and strength with the right nutrition and training.', icon: 'trending-up', color: theme.colors.error },
  { value: 'live_healthier', title: 'Live Healthier', description: 'Improve overall health and build better daily habits.', icon: 'feather', color: theme.colors.nutrition.purple },
];

export interface ActivityOption {
  value: ActivityLevel;
  title: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  color: string;
}

export const ACTIVITY_OPTIONS: ActivityOption[] = [
  { value: 'sedentary', title: 'Sedentary', description: 'Little or no exercise', icon: 'moon', color: theme.colors.textSecondary },
  { value: 'light', title: 'Light', description: '1-3 days/week light activity', icon: 'feather', color: '#E0A233' },
  { value: 'moderate', title: 'Moderate', description: '3-5 days/week moderate activity', icon: 'wind', color: '#E0A233' },
  { value: 'active', title: 'Active', description: '6-7 days/week hard activity', icon: 'activity', color: theme.colors.error },
  { value: 'very_active', title: 'Very Active', description: 'Intense exercise daily', icon: 'zap', color: theme.colors.nutrition.purple },
];

/** Discrete weekly weight-change pace choices (kg/week), used for both lose_weight and build_muscle goals. */
export const PACE_OPTIONS = [0.25, 0.5, 0.75, 1.0];
