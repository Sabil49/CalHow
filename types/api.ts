/**
 * Strict types for the Next.js backend API contract. The Expo app never
 * calls an AI provider directly — every request goes through these
 * endpoints so secrets stay server-side.
 *
 * Backend base URL comes from EXPO_PUBLIC_API_BASE_URL (see services/api.ts).
 */
import type {
  AiMealPrediction,
  ClarificationAnswer,
  ClarificationQuestion,
  FoodItem,
} from './models';

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
  };
}

/** POST /api/meals/analyze */
export interface AnalyzeMealRequest {
  imageBase64: string;
  mimeType: 'image/jpeg' | 'image/png';
}

export interface AnalyzeMealResponse {
  analysisId: string;
  prediction: AiMealPrediction;
  needsClarification: boolean;
  clarificationQuestions?: ClarificationQuestion[];
  /**
   * Backend-authoritative free-tier scan quota status, as of this call —
   * see calhow-backend/services/usage/scanLimit.ts. Informational only:
   * this app must never enforce the limit itself from this value (it
   * always reflects a call that already succeeded) — the backend already
   * rejected the request with `scan_limit_reached` before this response
   * could exist, if the quota was exhausted. `null` count/limit fields
   * mean unlimited (a 'pro' entitlement).
   */
  quota?: {
    entitlement: 'free' | 'pro';
    scansUsedToday: number | null;
    scansRemainingToday: number | null;
    dailyScanLimit: number | null;
  };
}

/** POST /api/meals/clarify */
export interface ClarifyMealRequest {
  analysisId: string;
  answers: ClarificationAnswer[];
}

export interface ClarifyMealResponse {
  prediction: AiMealPrediction;
}

/** POST /api/meals/recalculate — user edited detected foods, get fresh totals */
export interface RecalculateMealRequest {
  analysisId: string;
  foods: FoodItem[];
}

export interface RecalculateMealResponse {
  /** Per-food items with calories and portionLabel derived from the backend USDA match. sum(foods[].calories) === calories (to integer rounding). Use these to update session foods before saving — do not save the pre-recalculate foods alongside these totals. */
  foods: FoodItem[];
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  fiber?: number;
}

/**
 * POST /api/meals/image — uploads the captured meal photo to durable,
 * user-scoped remote storage and returns its URL. Same image/mimeType
 * shape as AnalyzeMealRequest, plus `analysisId` (the backend verifies
 * this analysisId belongs to the caller and uses it as the storage path
 * segment — calhow/users/{uid}/meals/{analysisId}). A separate call: see
 * services/mealImagePersistence.ts for why this happens independently of
 * analyze, and only once the user actually saves the meal.
 */
export interface UploadMealImageRequest {
  imageBase64: string;
  mimeType: 'image/jpeg' | 'image/png';
  analysisId: string;
}

export interface UploadMealImageResponse {
  /** Durable HTTPS URL — safe to store as Meal.imageUrl. Never a local/temporary file:// URI. */
  imageUrl: string;
}
