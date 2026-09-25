import { ApiError, uploadMealImage } from './api';

/**
 * Meal image persistence.
 *
 * ---------------------------------------------------------------------
 * THE PROBLEM (fixed by this module)
 * ---------------------------------------------------------------------
 * `expo-camera`/`expo-image-picker` return a local `file://` URI. That URI
 * is only valid on this device, in this app install, for as long as the OS
 * doesn't reclaim the cache/temp directory it points into. Saving that URI
 * into Firestore as `Meal.imageUrl` means the photo would eventually stop
 * loading (cache clear, reinstall, OS storage pressure) and would never
 * load on a second device.
 *
 * ---------------------------------------------------------------------
 * STORAGE APPROACH CHOSEN: backend-mediated upload to Firebase Storage
 * ---------------------------------------------------------------------
 * The already-existing Cloud Functions backend (the same trust boundary
 * used for AI vision calls, see services/api.ts) uploads the photo to
 * Firebase Storage and returns a durable HTTPS download-token URL. The
 * Expo app never talks to Storage directly — see
 * calhow-backend/functions/src/services/media/firebaseStorageImageProvider.ts
 * for the upload implementation and
 * calhow-backend/functions/src/meals/image.ts for the endpoint.
 * Ownership/scoping: the resulting path is `meals/{uid}/{analysisId}` —
 * `uid` comes from the caller's verified Firebase ID token (never
 * anything this app sends), and `analysisId` is ownership-checked
 * backend-side before use (same check clarify/recalculate already do). So
 * one user's upload can never collide with or overwrite another user's
 * image, or use an analysisId they don't own.
 *
 * `imageBase64`/`mimeType`/`analysisId` are all passed in directly from
 * scan session state (already captured at photo-capture/analyze time, see
 * hooks/useScanSession.tsx and app/scan/camera.tsx) — no re-read of the
 * device file is needed here.
 *
 * ---------------------------------------------------------------------
 * FAILURE HANDLING
 * ---------------------------------------------------------------------
 * `persistMealImage` THROWS on upload failure — it never falls back to
 * returning the local `file://` URI, and never silently drops the image.
 * The call site (app/scan/result.tsx) runs this inside `useAsyncAction`,
 * whose existing try/catch surfaces the thrown message as a visible
 * inline error and (critically) does NOT proceed to `saveMeal` or
 * navigate away — so a failed upload blocks the save with a clear,
 * retryable, user-facing error rather than saving a meal with a
 * non-durable or missing image silently.
 *
 * ---------------------------------------------------------------------
 * TODO — image cleanup on meal deletion (deferred, not implemented here)
 * ---------------------------------------------------------------------
 * This codebase has no per-meal delete function yet — services/firestore.ts
 * only has `deleteAllUserData` (bulk, used by account deletion). When a
 * per-meal delete is added, it MUST also delete the corresponding Storage
 * object before/after removing the Firestore doc, via a new backend-only
 * endpoint (never client-side — storage.rules denies all client access by
 * design, same reasoning as the upload side). The object path is
 * recoverable from the stored `imageUrl` itself (the path segment between
 * `/o/` and `?alt=media`, URL-decoded, e.g. `meals/{uid}/{analysisId}`) —
 * see calhow-backend/functions/src/services/media/imageStorage.ts's
 * `UploadImageResult.providerId` doc comment. Bulk account deletion has
 * the same gap today: `deleteAllUserData` removes the Firestore meal docs
 * but does not clean up their Storage objects — both should be addressed
 * together when per-meal delete is built.
 */

/**
 * Uploads a captured meal photo to durable remote storage and returns its
 * URL. Throws (never falls back to a local URI) if the upload fails — see
 * the "FAILURE HANDLING" section above for why, and how the caller should
 * (and already does) handle that.
 */
export async function persistMealImage(
  imageBase64: string,
  mimeType: 'image/jpeg' | 'image/png',
  analysisId: string,
): Promise<string> {
  try {
    const { imageUrl } = await uploadMealImage({ imageBase64, mimeType, analysisId });
    return imageUrl;
  } catch (err) {
    if (err instanceof ApiError) {
      throw new Error(`Couldn't save your meal photo: ${err.message}`);
    }
    throw new Error("Couldn't save your meal photo. Check your connection and try again.");
  }
}
