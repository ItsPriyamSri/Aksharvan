import { Permission, Role, AppwriteException } from 'appwrite';
import { databases } from '../client';
import { isAppwriteConfigured } from '../config';
import { DATABASE_ID, COLLECTION_PROFILES } from '../constants';
import type { Profile } from '../types';

const PROFILE_KEY = 'aksharvan:profile';

function readLocalProfile(userId: string): Partial<Profile> | null {
  const raw = localStorage.getItem(PROFILE_KEY);
  if (!raw) return null;
  const store: Record<string, Partial<Profile>> = JSON.parse(raw);
  return store[userId] ?? null;
}

function writeLocalProfile(userId: string, data: Partial<Profile>): void {
  const raw = localStorage.getItem(PROFILE_KEY);
  const store: Record<string, Partial<Profile>> = raw ? JSON.parse(raw) : {};
  store[userId] = { ...store[userId], ...data };
  localStorage.setItem(PROFILE_KEY, JSON.stringify(store));
}

export async function createProfile(
  userId: string,
  data: { parentPhone: string; childAge: number; avatarVariant: 0 | 1 | 2 },
): Promise<Partial<Profile>> {
  const docData = {
    parent_phone: data.parentPhone,
    child_age: data.childAge,
    avatar_variant: data.avatarVariant,
    language: 'hi',
    pin_hash: null,
    created_at: new Date().toISOString(),
  };

  if (isAppwriteConfigured()) {
    const doc = await databases.createDocument(
      DATABASE_ID,
      COLLECTION_PROFILES,
      userId,
      docData,
      [
        Permission.read(Role.user(userId)),
        Permission.update(Role.user(userId)),
        Permission.delete(Role.user(userId)),
      ],
    );
    return doc as unknown as Partial<Profile>;
  }

  const profile: Partial<Profile> = { $id: userId, ...docData };
  writeLocalProfile(userId, profile);
  return profile;
}

export async function getProfile(userId: string): Promise<Partial<Profile> | null> {
  if (isAppwriteConfigured()) {
    try {
      const doc = await databases.getDocument(DATABASE_ID, COLLECTION_PROFILES, userId);
      return doc as unknown as Partial<Profile>;
    } catch (e) {
      if (e instanceof AppwriteException && e.code === 404) return null;
      return null;
    }
  }
  return readLocalProfile(userId);
}

export async function updateProfile(
  userId: string,
  data: Partial<Profile>,
): Promise<Partial<Profile>> {
  if (isAppwriteConfigured()) {
    const doc = await databases.updateDocument(DATABASE_ID, COLLECTION_PROFILES, userId, data);
    return doc as unknown as Partial<Profile>;
  }
  writeLocalProfile(userId, data);
  return readLocalProfile(userId) ?? data;
}

export async function syncProfileToAppwrite(userId: string): Promise<void> {
  if (!isAppwriteConfigured()) return;
  try {
    await databases.getDocument(DATABASE_ID, COLLECTION_PROFILES, userId);
  } catch (e) {
    if (e instanceof AppwriteException && e.code === 404) {
      const local = readLocalProfile(userId);
      if (local) {
        await databases.createDocument(
          DATABASE_ID,
          COLLECTION_PROFILES,
          userId,
          local,
          [
            Permission.read(Role.user(userId)),
            Permission.update(Role.user(userId)),
            Permission.delete(Role.user(userId)),
          ],
        );
      }
    }
  }
}
