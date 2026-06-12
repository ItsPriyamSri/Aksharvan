// ---------------------------------------------------------------------------
// Appwrite document shapes
// ---------------------------------------------------------------------------

/** profiles collection — document id = account $id (1:1 with auth user) */
export interface Profile {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  parent_phone: string;
  language: string;
  child_age: number;
  avatar_variant: 0 | 1 | 2;
  pin_hash: string | null;
  created_at: string;
}

/** Shape of a single sub-level's progress, nested inside ProgressState */
export interface SublevelProgress {
  index: number;
  status: 'not_started' | 'in_progress' | 'completed';
  exercisesDone: number;
}

/**
 * Frontend-owned state shape stored as JSON string in progress.state.
 * Always JSON.stringify on write, JSON.parse on read.
 */
export interface ProgressState {
  sublevels: SublevelProgress[];
  restorationStage: number;
}

/** progress collection — document id = `${userId}_${levelId}` */
export interface Progress {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  profile_id: string;
  level_id: string;
  /** JSON string — parse with JSON.parse as ProgressState */
  state: string;
  updated_at: string;
}

/** recordings collection — consent-gated; document id = Appwrite auto-id */
export interface Recording {
  $id: string;
  $createdAt: string;
  $updatedAt: string;
  profile_id: string;
  exercise_id: string;
  /** Appwrite Storage file id in the recordings bucket */
  audio_path: string;
  expected: string;
  transcript: string | null;
  matched: boolean;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Function request / response shapes
// (call via functions.createExecution(functionId, JSON.stringify(body)))
// ---------------------------------------------------------------------------

/** set-pin — requires active session (x-appwrite-user-id header) */
export interface SetPinRequest {
  /** 4-digit string, e.g. "1234" */
  pin: string;
}

export interface SetPinResponse {
  ok: true;
}

/** login-with-pin — called WITHOUT an active session */
export interface LoginWithPinRequest {
  phone: string;
  /** 4-digit string */
  pin: string;
}

/** After receiving this, call account.createSession(userId, secret) */
export interface LoginWithPinResponse {
  userId: string;
  secret: string;
}

/** asr-recognize — requires active session */
export interface AsrRecognizeRequest {
  audioBase64: string;
  mimeType: string;
  /** Closed vocabulary — the Function matches against these */
  expected: string[];
  exerciseId: string;
}

export interface AsrRecognizeResponse {
  matched: boolean;
  /** 0–1 combined provider + match confidence */
  confidence: number;
  transcript: string;
}

/** Typed error shape returned by all Functions on failure */
export interface FunctionError {
  error: string;
  code: string;
}
