import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type {
  AiMealPrediction,
  ClarificationAnswer,
  ClarificationQuestion,
  FoodItem,
  MealType,
} from '@/types/models';
import type { AnalyzeMealResponse } from '@/types/api';

interface ScanSessionState {
  imageUri?: string;
  imageBase64?: string;
  /** MIME type of the captured/picked image — passed verbatim to the backend's vision API. */
  mimeType?: 'image/jpeg' | 'image/png';
  analysisId?: string;
  /** The untouched AI response — never mutated after analyze/clarify complete. */
  prediction?: AiMealPrediction;
  /**
   * Backend-authoritative scan quota status as of the analyze call —
   * informational display only (see AnalyzeMealResponse's doc comment in
   * types/api.ts). Never used to gate anything client-side; the backend
   * has already enforced the limit by the time this exists.
   */
  quota?: AnalyzeMealResponse['quota'];
  clarificationQuestions: ClarificationQuestion[];
  clarificationAnswers: ClarificationAnswer[];
  /** Editable working copy of detected foods, seeded from `prediction.foods` on Review. */
  foods: FoodItem[];
  mealType: MealType;
  /** Recalculated totals after the user edits foods on Review — becomes the saved Meal's totals. */
  finalTotals?: { calories: number; protein: number; carbs: number; fats: number; fiber?: number };
  savedMealId?: string;
}

interface ScanSessionContextValue extends ScanSessionState {
  setImage: (uri: string, base64: string, mimeType: 'image/jpeg' | 'image/png') => void;
  setAnalysis: (params: {
    analysisId: string;
    prediction: AiMealPrediction;
    clarificationQuestions?: ClarificationQuestion[];
    quota?: AnalyzeMealResponse['quota'];
  }) => void;
  setClarificationAnswer: (answer: ClarificationAnswer) => void;
  applyClarifiedPrediction: (prediction: AiMealPrediction) => void;
  setFoods: (foods: FoodItem[]) => void;
  setMealType: (mealType: MealType) => void;
  setFinalTotals: (totals: ScanSessionState['finalTotals']) => void;
  setSavedMealId: (mealId: string) => void;
  reset: () => void;
}

const initialState: ScanSessionState = {
  clarificationQuestions: [],
  clarificationAnswers: [],
  foods: [],
  mealType: 'snack',
};

const ScanSessionContext = createContext<ScanSessionContextValue | null>(null);

export function ScanSessionProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<ScanSessionState>(initialState);

  const setImage = useCallback((uri: string, base64: string, mimeType: 'image/jpeg' | 'image/png') => {
    setState((s) => ({ ...s, imageUri: uri, imageBase64: base64, mimeType }));
  }, []);

  const setAnalysis = useCallback<ScanSessionContextValue['setAnalysis']>((params) => {
    setState((s) => ({
      ...s,
      analysisId: params.analysisId,
      prediction: params.prediction,
      clarificationQuestions: params.clarificationQuestions ?? [],
      foods: params.prediction.foods,
      quota: params.quota,
    }));
  }, []);

  const setClarificationAnswer = useCallback((answer: ClarificationAnswer) => {
    setState((s) => ({
      ...s,
      clarificationAnswers: [
        ...s.clarificationAnswers.filter((a) => a.questionId !== answer.questionId),
        answer,
      ],
    }));
  }, []);

  const applyClarifiedPrediction = useCallback((prediction: AiMealPrediction) => {
    setState((s) => ({ ...s, prediction, foods: prediction.foods }));
  }, []);

  const setFoods = useCallback((foods: FoodItem[]) => {
    setState((s) => ({ ...s, foods }));
  }, []);

  const setMealType = useCallback((mealType: MealType) => {
    setState((s) => ({ ...s, mealType }));
  }, []);

  const setFinalTotals = useCallback((finalTotals: ScanSessionState['finalTotals']) => {
    setState((s) => ({ ...s, finalTotals }));
  }, []);

  const setSavedMealId = useCallback((savedMealId: string) => {
    setState((s) => ({ ...s, savedMealId }));
  }, []);

  const reset = useCallback(() => setState(initialState), []);

  const value = useMemo<ScanSessionContextValue>(
    () => ({
      ...state,
      setImage,
      setAnalysis,
      setClarificationAnswer,
      applyClarifiedPrediction,
      setFoods,
      setMealType,
      setFinalTotals,
      setSavedMealId,
      reset,
    }),
    [state, setImage, setAnalysis, setClarificationAnswer, applyClarifiedPrediction, setFoods, setMealType, setFinalTotals, setSavedMealId, reset],
  );

  return <ScanSessionContext.Provider value={value}>{children}</ScanSessionContext.Provider>;
}

export function useScanSession() {
  const ctx = useContext(ScanSessionContext);
  if (!ctx) throw new Error('useScanSession must be used within ScanSessionProvider');
  return ctx;
}

/** Suggests a meal type from the current time of day — used as the default when saving. */
export function suggestMealTypeForNow(date: Date = new Date()): MealType {
  const hour = date.getHours();
  if (hour < 11) return 'breakfast';
  if (hour < 16) return 'lunch';
  if (hour < 21) return 'dinner';
  return 'snack';
}
