import { auth } from './firebase';
import type {
  AnalyzeMealRequest,
  AnalyzeMealResponse,
  ApiErrorBody,
  ClarifyMealRequest,
  ClarifyMealResponse,
  RecalculateMealRequest,
  RecalculateMealResponse,
  UploadMealImageRequest,
  UploadMealImageResponse,
} from '@/types/api';

/**
 * Thin client for the CalHow Next.js backend. This is the ONLY place the
 * app talks to AI meal analysis — the Expo app must never hold an AI
 * provider API key. The backend re-derives the caller's identity from the
 * Firebase ID token, so requests are attributable without trusting any
 * client-supplied uid.
 */

const BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? '';

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function authedFetch<TResponse>(path: string, body: unknown): Promise<TResponse> {
  if (!BASE_URL) {
    throw new ApiError(
      0,
      'missing_config',
      'EXPO_PUBLIC_API_BASE_URL is not set. Point it at your deployed Next.js backend.',
    );
  }

  const idToken = await auth.currentUser?.getIdToken();
  if (!idToken) {
    throw new ApiError(401, 'unauthenticated', 'You must be signed in to do this.');
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${idToken}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new ApiError(
      response.status,
      errorBody?.error.code ?? 'unknown_error',
      errorBody?.error.message ?? `Request failed with status ${response.status}`,
    );
  }

  return (await response.json()) as TResponse;
}

/** POST /api/meals/analyze — scan a meal photo and get an AI nutrition estimate. */
export function analyzeMeal(payload: AnalyzeMealRequest) {
  return authedFetch<AnalyzeMealResponse>('/api/meals/analyze', payload);
}

/** POST /api/meals/clarify — submit answers to clarification questions. */
export function clarifyMeal(payload: ClarifyMealRequest) {
  return authedFetch<ClarifyMealResponse>('/api/meals/clarify', payload);
}

/** POST /api/meals/recalculate — recompute totals after the user edits detected foods. */
export function recalculateMeal(payload: RecalculateMealRequest) {
  return authedFetch<RecalculateMealResponse>('/api/meals/recalculate', payload);
}

/** POST /api/meals/image — upload a captured meal photo to durable remote storage, get back its URL. */
export function uploadMealImage(payload: UploadMealImageRequest) {
  return authedFetch<UploadMealImageResponse>('/api/meals/image', payload);
}
