// Aksharvan — Progress types (updated with hasSeenIntro — M1 decision)
// The `progress` document's `state` field is stored as JSON.stringify(ProgressState).

export type SublevelStatus = "locked" | "active" | "completed";

export type SublevelProgress = {
  index: number;
  status: SublevelStatus;
  exercisesDone: number; // 0–7
};

/**
 * The frontend-owned shape that gets JSON.stringified into the `state` column.
 * On write: JSON.stringify(state). On read: JSON.parse(state).
 */
export type ProgressState = {
  /** True after the world intro video has been watched once */
  hasSeenIntro: boolean;
  /** 1-based current level index */
  currentLevel: number;
  sublevels: SublevelProgress[];
  /** 0–6, increments with each completed sub-level */
  restorationStage: number;
};

/**
 * The Appwrite document shape for the `progress` collection.
 * document id = `${userId}_${levelId}`
 */
export type ProgressDocument = {
  $id: string;
  profile_id: string;
  level_id: string;
  /** JSON-stringified ProgressState */
  state: string;
  updated_at: string;
};

/**
 * The Appwrite document shape for the `profiles` collection.
 * document id = account.$id
 */
export type ProfileDocument = {
  $id: string;
  parent_phone: string;
  language: "hi";
  child_age: number;
  avatar_variant: 0 | 1 | 2;
  pin_hash?: string;
  created_at: string;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Derive avatar variant from age (spec §7): 4–5→0, 6–7→1, 8–10→2 */
export function avatarVariantFromAge(age: number): 0 | 1 | 2 {
  if (age <= 5) return 0;
  if (age <= 7) return 1;
  return 2;
}

/** Build a fresh ProgressState for a new user */
export function initialProgressState(): ProgressState {
  return {
    hasSeenIntro: false,
    currentLevel: 1,
    sublevels: Array.from({ length: 6 }, (_, i) => ({
      index: i,
      status: i === 0 ? "active" : "locked",
      exercisesDone: 0,
    })),
    restorationStage: 0,
  };
}
