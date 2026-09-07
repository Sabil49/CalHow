import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
  type CollectionReference,
  type DocumentData,
  type QueryDocumentSnapshot,
  type Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Correction, Meal, UserProfile, WeightLog } from '@/types/models';

/**
 * Firestore access layer. Screens/hooks should never import `firebase/firestore`
 * directly — go through these functions so:
 *   - Timestamp <-> Date conversion happens in exactly one place
 *   - collection paths are defined exactly once
 *   - it's easy to swap persistence details later without touching UI code
 */

const usersCol = () => collection(db, 'users');
const userDoc = (uid: string) => doc(db, 'users', uid);
const mealsCol = (uid: string) => collection(db, 'users', uid, 'meals');
const mealDoc = (uid: string, mealId: string) => doc(db, 'users', uid, 'meals', mealId);
const weightLogsCol = (uid: string) => collection(db, 'users', uid, 'weightLogs');
const correctionsCol = (uid: string) => collection(db, 'users', uid, 'corrections');

function toDate(value: unknown): Date | undefined {
  if (value instanceof Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return undefined;
}

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

function mapUserProfile(snap: QueryDocumentSnapshot<DocumentData>): UserProfile {
  const data = snap.data();
  return {
    uid: snap.id,
    email: data.email ?? null,
    fullName: data.fullName ?? '',
    photoUrl: data.photoUrl ?? null,
    gender: data.gender,
    dateOfBirth: data.dateOfBirth,
    heightCm: data.heightCm,
    currentWeightKg: data.currentWeightKg,
    bodyFatPercent: data.bodyFatPercent,
    waistCircumferenceCm: data.waistCircumferenceCm,
    preferredUnit: data.preferredUnit ?? 'metric',
    goals: data.goals,
    dietaryPreferences: data.dietaryPreferences,
    reminders: data.reminders,
    onboardingComplete: data.onboardingComplete ?? false,
    subscription: data.subscription ?? { tier: 'free' },
    streakDays: data.streakDays ?? 0,
    memberSince: toDate(data.memberSince) ?? new Date(),
    createdAt: toDate(data.createdAt) ?? new Date(),
    updatedAt: toDate(data.updatedAt) ?? new Date(),
  };
}

export async function createUserProfile(
  uid: string,
  params: { email: string | null; fullName: string },
) {
  await setDoc(userDoc(uid), {
    email: params.email,
    fullName: params.fullName,
    photoUrl: null,
    preferredUnit: 'metric',
    onboardingComplete: false,
    subscription: { tier: 'free' },
    streakDays: 0,
    memberSince: serverTimestamp(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(userDoc(uid));
  if (!snap.exists()) return null;
  return mapUserProfile(snap as QueryDocumentSnapshot<DocumentData>);
}

export function subscribeToUserProfile(
  uid: string,
  callback: (profile: UserProfile | null) => void,
): Unsubscribe {
  return onSnapshot(userDoc(uid), (snap) => {
    callback(snap.exists() ? mapUserProfile(snap as QueryDocumentSnapshot<DocumentData>) : null);
  });
}

export async function updateUserProfile(uid: string, patch: Partial<UserProfile>) {
  await updateDoc(userDoc(uid), { ...patch, updatedAt: serverTimestamp() });
}

// ---------------------------------------------------------------------------
// Meals
// ---------------------------------------------------------------------------

function mapMeal(snap: QueryDocumentSnapshot<DocumentData>): Meal {
  const data = snap.data();
  return {
    id: snap.id,
    userId: data.userId,
    mealType: data.mealType,
    imageUrl: data.imageUrl,
    calories: data.calories ?? 0,
    protein: data.protein ?? 0,
    carbs: data.carbs ?? 0,
    fats: data.fats ?? 0,
    fiber: data.fiber,
    foods: data.foods ?? [],
    aiPrediction: data.aiPrediction,
    clarificationAnswers: data.clarificationAnswers,
    userCorrections: data.userCorrections,
    confidence: data.confidence,
    isSaved: data.isSaved ?? true,
    loggedAt: toDate(data.loggedAt) ?? new Date(),
    createdAt: toDate(data.createdAt) ?? new Date(),
    updatedAt: toDate(data.updatedAt) ?? new Date(),
  };
}

/**
 * Persist a confirmed meal. `aiPrediction` must be the untouched backend
 * response — see types/models.ts Meal doc comment. Corrections are stored
 * separately in `userCorrections` and never merged into `aiPrediction`.
 */
export async function saveMeal(
  uid: string,
  meal: Omit<Meal, 'id' | 'createdAt' | 'updatedAt'>,
) {
  const ref = await addDoc(mealsCol(uid), {
    ...meal,
    loggedAt: Timestamp.fromDate(meal.loggedAt),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function getMeal(uid: string, mealId: string): Promise<Meal | null> {
  const snap = await getDoc(mealDoc(uid, mealId));
  if (!snap.exists()) return null;
  return mapMeal(snap as QueryDocumentSnapshot<DocumentData>);
}

export async function getMealsForDate(uid: string, date: Date): Promise<Meal[]> {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const q = query(
    mealsCol(uid),
    where('loggedAt', '>=', Timestamp.fromDate(start)),
    where('loggedAt', '<=', Timestamp.fromDate(end)),
    orderBy('loggedAt', 'desc'),
  );
  const snap = await getDocs(q);
  return snap.docs.map(mapMeal);
}

export async function getRecentMeals(uid: string, count = 30): Promise<Meal[]> {
  const q = query(mealsCol(uid), orderBy('loggedAt', 'desc'), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map(mapMeal);
}

export function subscribeToMealsForDate(
  uid: string,
  date: Date,
  callback: (meals: Meal[]) => void,
): Unsubscribe {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const q = query(
    mealsCol(uid),
    where('loggedAt', '>=', Timestamp.fromDate(start)),
    where('loggedAt', '<=', Timestamp.fromDate(end)),
    orderBy('loggedAt', 'desc'),
  );
  return onSnapshot(q, (snap) => callback(snap.docs.map(mapMeal)));
}

export async function updateMealCorrections(
  uid: string,
  mealId: string,
  patch: Partial<Pick<Meal, 'foods' | 'calories' | 'protein' | 'carbs' | 'fats' | 'fiber' | 'userCorrections'>>,
) {
  await updateDoc(mealDoc(uid, mealId), { ...patch, updatedAt: serverTimestamp() });
}

// ---------------------------------------------------------------------------
// Weight logs
// ---------------------------------------------------------------------------

function mapWeightLog(snap: QueryDocumentSnapshot<DocumentData>): WeightLog {
  const data = snap.data();
  return {
    id: snap.id,
    userId: data.userId,
    weightKg: data.weightKg,
    note: data.note,
    loggedAt: toDate(data.loggedAt) ?? new Date(),
    createdAt: toDate(data.createdAt) ?? new Date(),
  };
}

export async function addWeightLog(
  uid: string,
  params: { weightKg: number; note?: string; loggedAt: Date },
) {
  const ref = await addDoc(weightLogsCol(uid), {
    userId: uid,
    weightKg: params.weightKg,
    note: params.note ?? null,
    loggedAt: Timestamp.fromDate(params.loggedAt),
    createdAt: serverTimestamp(),
  });
  await updateUserProfile(uid, { currentWeightKg: params.weightKg });
  return ref.id;
}

export async function getWeightLogs(uid: string, count = 60): Promise<WeightLog[]> {
  const q = query(weightLogsCol(uid), orderBy('loggedAt', 'desc'), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map(mapWeightLog);
}

export function subscribeToWeightLogs(
  uid: string,
  callback: (logs: WeightLog[]) => void,
  count = 60,
): Unsubscribe {
  const q = query(weightLogsCol(uid), orderBy('loggedAt', 'desc'), limit(count));
  return onSnapshot(q, (snap) => callback(snap.docs.map(mapWeightLog)));
}

// ---------------------------------------------------------------------------
// Corrections (feeds future Smart Meal Memory)
// ---------------------------------------------------------------------------

export async function logCorrection(
  uid: string,
  correction: Omit<Correction, 'id' | 'createdAt'>,
) {
  await addDoc(correctionsCol(uid), {
    ...correction,
    createdAt: serverTimestamp(),
  });
}

// ---------------------------------------------------------------------------
// Account deletion
// ---------------------------------------------------------------------------

/**
 * Firestore does not cascade-delete subcollections when a parent document
 * is deleted — each subcollection must be emptied explicitly. This reads
 * and deletes in bounded batches (Firestore batched writes cap at 500 ops)
 * so it works regardless of how many meals/logs/corrections a user has.
 */
async function deleteCollectionInBatches(colRef: CollectionReference<DocumentData>, batchSize = 300) {
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const snap = await getDocs(query(colRef, limit(batchSize)));
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach((docSnap) => batch.delete(docSnap.ref));
    await batch.commit();
    if (snap.size < batchSize) return;
  }
}

/**
 * Deletes every piece of CalHow data this app's Firestore schema knows
 * about for `uid`: the meals/weightLogs/corrections subcollections, then
 * the users/{uid} profile document itself.
 *
 * Called by services/account.ts as part of full account deletion — see
 * that file for what this does NOT cover (Auth account removal, and any
 * future backend/Storage/billing data).
 */
export async function deleteAllUserData(uid: string): Promise<void> {
  await deleteCollectionInBatches(mealsCol(uid));
  await deleteCollectionInBatches(weightLogsCol(uid));
  await deleteCollectionInBatches(correctionsCol(uid));
  await deleteDoc(userDoc(uid));
}
