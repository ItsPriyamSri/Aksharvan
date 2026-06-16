// Aksharvan — Appwrite Client singleton
// All SDK calls go through these exported instances.
// IDs come from lib/appwrite/constants.ts — never from env vars.

import { Client, Account, Databases, Storage, Functions } from "appwrite";

const endpoint  = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT  ?? "";
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "";

if (!endpoint || !projectId) {
  if (typeof window !== "undefined") {
    console.warn(
      "[Aksharvan] Missing Appwrite env vars. " +
        "Copy .env.local.example → .env.local and fill in NEXT_PUBLIC_APPWRITE_*."
    );
  }
}

export const appwriteClient = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId);

export const account   = new Account(appwriteClient);
export const databases = new Databases(appwriteClient);
export const storage   = new Storage(appwriteClient);
export const functions = new Functions(appwriteClient);
