// Aksharvan — Profile Service
// CRUD for the `profiles` collection (spec §4).

import { Permission, Role } from "appwrite";
import { databases } from "./client";
import { DATABASE_ID, COLLECTION_PROFILES } from "./constants";
import type { ProfileDocument } from "@/types/progress";

// ─── Read ─────────────────────────────────────────────────────────────────────

export async function getProfile(userId: string): Promise<ProfileDocument | null> {
  try {
    const doc = await databases.getDocument(DATABASE_ID, COLLECTION_PROFILES, userId);
    return doc as unknown as ProfileDocument;
  } catch {
    return null;
  }
}

// ─── Create ───────────────────────────────────────────────────────────────────

type CreateProfileInput = {
  userId: string;
  parentPhone: string;
  childAge: number;
  avatarVariant: 0 | 1 | 2;
};

export async function createProfile(input: CreateProfileInput): Promise<ProfileDocument> {
  const { userId, parentPhone, childAge, avatarVariant } = input;

  const doc = await databases.createDocument(
    DATABASE_ID,
    COLLECTION_PROFILES,
    userId, // document id = account.$id (1:1 relationship)
    {
      parent_phone:    parentPhone,
      language:        "hi",
      child_age:       childAge,
      avatar_variant:  avatarVariant,
      created_at:      new Date().toISOString(),
    },
    [
      Permission.read(Role.user(userId)),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
    ]
  );

  return doc as unknown as ProfileDocument;
}

// ─── Update ───────────────────────────────────────────────────────────────────

type UpdateProfileInput = Partial<{
  childAge: number;
  avatarVariant: 0 | 1 | 2;
}>;

export async function updateProfile(
  userId: string,
  updates: UpdateProfileInput
): Promise<ProfileDocument> {
  const data: Record<string, unknown> = {};
  if (updates.childAge !== undefined)      data["child_age"]      = updates.childAge;
  if (updates.avatarVariant !== undefined) data["avatar_variant"] = updates.avatarVariant;

  const doc = await databases.updateDocument(DATABASE_ID, COLLECTION_PROFILES, userId, data);
  return doc as unknown as ProfileDocument;
}
