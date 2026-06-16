// Aksharvan — Auth Service
// Wraps Appwrite Account API calls from spec §4.
// Returns typed results; all errors are caught and re-thrown with a message.

import { ID } from "appwrite";
import { account } from "./client";
import type { Models } from "appwrite";

// ─── Types ────────────────────────────────────────────────────────────────────

export type PhoneTokenResult = {
  userId: string;
};

export type SessionResult = {
  userId: string;
  session: Models.Session;
};

// ─── Auth functions ───────────────────────────────────────────────────────────

/**
 * Step 1 of phone-OTP signup.
 * Sends an SMS OTP to the given phone number.
 * For a new user, pass userId = ID.unique().
 * For an existing user, pass their existing userId.
 */
export async function sendPhoneOTP(
  phone: string,
  userId?: string
): Promise<PhoneTokenResult> {
  try {
    const uid = userId ?? ID.unique();
    const token = await account.createPhoneToken(uid, phone);
    return { userId: token.userId };
  } catch (err: unknown) {
    throw new Error(
      `sendPhoneOTP failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/**
 * Step 2 of phone-OTP login.
 * Verifies the OTP and creates an Appwrite session.
 */
export async function verifyPhoneOTP(
  userId: string,
  otp: string
): Promise<SessionResult> {
  try {
    const session = await account.createSession(userId, otp);
    return { userId: session.userId, session };
  } catch (err: unknown) {
    throw new Error(
      `verifyPhoneOTP failed: ${err instanceof Error ? err.message : String(err)}`
    );
  }
}

/**
 * Get the currently logged-in account (throws if no session).
 */
export async function getCurrentAccount(): Promise<Models.User<Models.Preferences>> {
  return await account.get();
}

/**
 * Delete the current session (logout).
 */
export async function logout(): Promise<void> {
  try {
    await account.deleteSession("current");
  } catch {
    // Ignore — session may already be gone
  }
}

/**
 * Check whether a session exists without throwing.
 * Returns the account or null.
 */
export async function getSessionSafe(): Promise<Models.User<Models.Preferences> | null> {
  try {
    return await account.get();
  } catch {
    return null;
  }
}
