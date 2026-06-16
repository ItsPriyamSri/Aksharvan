// Aksharvan — Storage Service
// Resolve Appwrite file IDs to URLs for audio, images, and Lottie.

import { ImageFormat } from "appwrite";
import { storage } from "./client";
import { BUCKET_AUDIO } from "./constants";

// ─── URL builders ─────────────────────────────────────────────────────────────

/**
 * Get the raw file URL (audio, Lottie JSON).
 * Defaults to the audio bucket — pass a different bucketId for images/animations.
 */
export function getFileViewUrl(fileId: string, bucketId = BUCKET_AUDIO): string {
  return storage.getFileView(bucketId, fileId).toString();
}

/**
 * Get a downscaled, modern-format image URL via Appwrite's getFilePreview.
 * Defaults to webp at 800px wide and quality 80 — good for weak networks.
 */
export function getImagePreviewUrl(
  fileId: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: ImageFormat;
    bucketId?: string;
  } = {}
): string {
  const {
    width    = 800,
    height   = 0,
    quality  = 80,
    format   = ImageFormat.Webp,
    bucketId = BUCKET_AUDIO,
  } = options;

  return storage
    .getFilePreview(
      bucketId,
      fileId,
      width,
      height,
      undefined,
      quality,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      format
    )
    .toString();
}

/**
 * Build the Appwrite endpoint prefix for manual URL construction.
 * Useful when the SDK isn't available (e.g. service worker fetch).
 */
export function buildStorageBaseUrl(bucketId = BUCKET_AUDIO): string {
  const endpoint  = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "";
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "";
  return `${endpoint}/storage/buckets/${bucketId}/files?project=${projectId}`;
}
