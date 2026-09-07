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
 * STORAGE APPROACH CHOSEN: backend-mediated upload to Cloudinary
 * ---------------------------------------------------------------------
 * This project is on the Firebase Spark (free, no billing account) plan.
 * Firebase now requires upgrading to the Blaze plan (linking a billing
 * account) before Cloud Storage for Firebase can be enabled at all, even
 * for free-tier usage — so this does NOT use Firebase Storage.
 *
 * Instead: the already-existing Next.js backend (the same trust boundary
 * used for AI vision calls, see services/api.ts) uploads the photo to
 * Cloudinary and returns a durable HTTPS URL. The Expo app never talks to
 * Cloudinary directly and never holds a Cloudinary credential — see
 * calhow-backend/services/media/cloudinaryImageStorageProvider.ts for the
 * upload implementation and calhow-backend/app/api/meals/image/route.ts
 * for the endpoint. Ownership/scoping: the resulting path is
 * `calhow/users/{uid}/meals/{analysisId}` — `uid` comes from the caller's
 * verified Firebase ID token (never anything this app sends), and
 * `analysisId` is ownership-checked backend-side before use (same check
 * clarify/recalculate already do). So one user's upload can never collide
 * with or overwrite another user's image, or use an analysisId they don't
 * own.
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
 * per-meal delete is added, it MUST also delete the corresponding
 * Cloudinary asset before/after removing the Firestore doc, via a new
 * backend-only endpoint (never client-side — CLOUDINARY_API_SECRET must
 * stay server-only, same reasoning as the upload side). The asset's
 * Cloudinary `public_id` is recoverable from the stored `imageUrl` itself
 * (the path segment between `/upload/v<version>/` and the file
 * extension, e.g. `calhow/users/{uid}/meals/{analysisId}`) — see
 * calhow-backend/services/media/imageStorage.ts's `UploadImageResult.
 * providerId` doc comment. Bulk account deletion has the same gap today:
 * `deleteAllUserData` removes the Firestore meal docs but does not clean
 * up their Cloudinary assets — both should be addressed together when
 * per-meal delete is built.
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
