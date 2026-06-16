// Aksharvan — Progress Service
// CRUD for the `progress` collection (spec §4).
// `state` is stored as JSON.stringify(ProgressState) — a string column.

import { Permission, Role } from "appwrite";
import { databases } from "./client";
import { DATABASE_ID, COLLECTION_PROGRESS } from "./constants";
import type { ProgressDocument, ProgressState } from "@/types/progress";
import { initialProgressState } from "@/types/progress";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Document id = `${userId}_${levelId}` (natural upsert key) */
function progressDocId(userId: string, levelId: string): string {
  return `${userId}_${levelId}`;
}

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getProgress(
  userId: string,
  levelId: string
): Promise<{ doc: ProgressDocument; state: ProgressState } | null> {
  try {
    const docId = progressDocId(userId, levelId);
    const doc = await databases.getDocument(DATABASE_ID, COLLECTION_PROGRESS, docId);
    const raw = doc as unknown as ProgressDocument;
    const state: ProgressState = JSON.parse(raw.state);
    return { doc: raw, state };
  } catch {
    return null;
  }
}

// ─── Create (initial progress for a new user) ─────────────────────────────────

export async function createProgress(
  userId: string,
  levelId: string
): Promise<{ doc: ProgressDocument; state: ProgressState }> {
  const docId = progressDocId(userId, levelId);
  const state = initialProgressState();

  const doc = await databases.createDocument(
    DATABASE_ID,
    COLLECTION_PROGRESS,
    docId,
    {
      profile_id:  userId,
      level_id:    levelId,
      state:       JSON.stringify(state),
      updated_at:  new Date().toISOString(),
    },
    [
      Permission.read(Role.user(userId)),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ]
  );

  return { doc: doc as unknown as ProgressDocument, state };
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function saveProgress(
  userId: string,
  levelId: string,
  state: ProgressState
): Promise<ProgressDocument> {
  const docId = progressDocId(userId, levelId);

  const doc = await databases.updateDocument(DATABASE_ID, COLLECTION_PROGRESS, docId, {
    state:      JSON.stringify(state),
    updated_at: new Date().toISOString(),
  });

  return doc as unknown as ProgressDocument;
}

// ─── Get or create ────────────────────────────────────────────────────────────

export async function getOrCreateProgress(
  userId: string,
  levelId: string
): Promise<{ doc: ProgressDocument; state: ProgressState }> {
  const existing = await getProgress(userId, levelId);
  if (existing) return existing;
  return await createProgress(userId, levelId);
}
