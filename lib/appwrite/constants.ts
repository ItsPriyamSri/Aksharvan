// ---------------------------------------------------------------------------
// Appwrite resource IDs — import these; never hardcode strings in the app
// ---------------------------------------------------------------------------

export const DATABASE_ID = 'aksharvan';

// Collections
export const COLLECTION_PROFILES = 'profiles';
export const COLLECTION_PROGRESS = 'progress';
export const COLLECTION_RECORDINGS = 'recordings';

// Storage buckets
export const BUCKET_IMAGES = 'images';
export const BUCKET_ANIMATIONS = 'animations';
export const BUCKET_AUDIO = 'audio';
export const BUCKET_RECORDINGS = 'recordings';

/**
 * Function IDs — these match the $id values in appwrite.json once functions
 * are created. Update after deploying with `appwrite deploy function`.
 */
export const FUNCTION_SET_PIN = 'set-pin';
export const FUNCTION_LOGIN_WITH_PIN = 'login-with-pin';
export const FUNCTION_ASR_RECOGNIZE = 'asr-recognize';
