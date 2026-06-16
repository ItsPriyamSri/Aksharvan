import { Permission, Role, AppwriteException } from 'appwrite';
import { databases } from '../client';
import { isAppwriteConfigured } from '../config';
import { DATABASE_ID, COLLECTION_PROGRESS } from '../constants';
import type { ProgressState, SublevelProgress } from '../types';

export interface ExtendedProgressState extends ProgressState {
  currentSublevelIndex?: number;
  currentExerciseIndex?: number;
  introSeen?: boolean;
  levelIntroSeen?: boolean;
}

const PROGRESS_KEY = 'aksharvan:progress';

function docId(userId: string, levelId: string): string {
  return `${userId}_${levelId}`;
}

function initialState(): ExtendedProgressState {
  const sublevels: SublevelProgress[] = Array.from({ length: 6 }, (_, i) => ({
    index: i,
    status: 'not_started',
    exercisesDone: 0,
  }));
  return {
    sublevels,
    restorationStage: 0,
    currentSublevelIndex: 0,
    currentExerciseIndex: 0,
    introSeen: false,
    levelIntroSeen: false,
  };
}

function readLocal(id: string): ExtendedProgressState | null {
  const raw = localStorage.getItem(PROGRESS_KEY);
  if (!raw) return null;
  const store: Record<string, ExtendedProgressState> = JSON.parse(raw);
  return store[id] ?? null;
}

function writeLocal(id: string, state: ExtendedProgressState): void {
  const raw = localStorage.getItem(PROGRESS_KEY);
  const store: Record<string, ExtendedProgressState> = raw ? JSON.parse(raw) : {};
  store[id] = state;
  localStorage.setItem(PROGRESS_KEY, JSON.stringify(store));
}

export async function createProgress(
  userId: string,
  levelId: string,
): Promise<ExtendedProgressState> {
  const id = docId(userId, levelId);
  const state = initialState();

  if (isAppwriteConfigured()) {
    try {
      const existing = await databases.getDocument(DATABASE_ID, COLLECTION_PROGRESS, id);
      return JSON.parse(existing.state as string) as ExtendedProgressState;
    } catch (e) {
      if (e instanceof AppwriteException && e.code === 404) {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTION_PROGRESS,
          id,
          {
            profile_id: userId,
            level_id: levelId,
            state: JSON.stringify(state),
            updated_at: new Date().toISOString(),
          },
          [
            Permission.read(Role.user(userId)),
            Permission.update(Role.user(userId)),
            Permission.delete(Role.user(userId)),
          ],
        );
        return state;
      }
      throw e;
    }
  }

  const existing = readLocal(id);
  if (existing) return existing;
  writeLocal(id, state);
  return state;
}

export async function getProgress(
  userId: string,
  levelId: string,
): Promise<ExtendedProgressState> {
  const id = docId(userId, levelId);

  if (isAppwriteConfigured()) {
    try {
      const doc = await databases.getDocument(DATABASE_ID, COLLECTION_PROGRESS, id);
      return JSON.parse(doc.state as string) as ExtendedProgressState;
    } catch (e) {
      if (e instanceof AppwriteException && e.code === 404) {
        return createProgress(userId, levelId);
      }
      throw e;
    }
  }

  const local = readLocal(id);
  if (local) return local;
  return createProgress(userId, levelId);
}

export async function saveProgress(
  userId: string,
  levelId: string,
  state: ExtendedProgressState,
): Promise<void> {
  const id = docId(userId, levelId);

  if (isAppwriteConfigured()) {
    try {
      await databases.updateDocument(DATABASE_ID, COLLECTION_PROGRESS, id, {
        state: JSON.stringify(state),
        updated_at: new Date().toISOString(),
      });
    } catch (e) {
      if (e instanceof AppwriteException && e.code === 404) {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTION_PROGRESS,
          id,
          {
            profile_id: userId,
            level_id: levelId,
            state: JSON.stringify(state),
            updated_at: new Date().toISOString(),
          },
          [
            Permission.read(Role.user(userId)),
            Permission.update(Role.user(userId)),
            Permission.delete(Role.user(userId)),
          ],
        );
        return;
      }
      throw e;
    }
    return;
  }

  writeLocal(id, state);
}

export async function syncProgressToAppwrite(
  userId: string,
  levelId: string,
): Promise<ExtendedProgressState> {
  const id = docId(userId, levelId);

  if (!isAppwriteConfigured()) {
    const local = readLocal(id);
    return local ?? initialState();
  }

  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTION_PROGRESS, id);
    const remote = JSON.parse(doc.state as string) as ExtendedProgressState;
    writeLocal(id, remote);
    return remote;
  } catch (e) {
    if (e instanceof AppwriteException && e.code === 404) {
      const local = readLocal(id) ?? initialState();
      await saveProgress(userId, levelId, local);
      return local;
    }
    throw e;
  }
}
