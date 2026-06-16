"use client";

// AuthContext — session management with mock-mode persistence.
//
// MOCK MODE (no Appwrite project configured):
//   Real Appwrite sessions cannot be created, so we persist a mock session
//   in localStorage under the key "aksharvan_mock_session".
//   This survives page navigation and browser refresh within the same tab.
//   It is cleared on explicit logout.
//
// REAL MODE:
//   Standard Appwrite account.get() session check on mount.

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { Models } from "appwrite";
import { getSessionSafe, logout as appwriteLogout } from "@/lib/appwrite/auth";
import { getProfile } from "@/lib/appwrite/profile";
import type { ProfileDocument } from "@/types/progress";

// ─── Mock session storage ─────────────────────────────────────────────────────

const IS_MOCK =
  !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID === "your_project_id";

const MOCK_SESSION_KEY = "aksharvan_mock_session";

type MockSession = {
  userId: string;
  profile: ProfileDocument;
};

function getMockSession(): MockSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(MOCK_SESSION_KEY);
    return raw ? (JSON.parse(raw) as MockSession) : null;
  } catch {
    return null;
  }
}

function setMockSession(session: MockSession): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
}

function clearMockSession(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(MOCK_SESSION_KEY);
}

// ─── Context shape ────────────────────────────────────────────────────────────

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  user: Models.User<Models.Preferences> | null;
  profile: ProfileDocument | null;
  isMock: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  setProfile: (p: ProfileDocument | null) => void;
  /** Mock-only: persist a mock session so navigation doesn't reset auth */
  saveMockSession: (userId: string, profile: ProfileDocument) => void;
};

// ─── Fake Appwrite user shape for mock mode ───────────────────────────────────

function makeMockUser(userId: string): Models.User<Models.Preferences> {
  return {
    $id:               userId,
    $createdAt:        new Date().toISOString(),
    $updatedAt:        new Date().toISOString(),
    name:              "Mock User",
    password:          "",
    hash:              "",
    hashOptions:       {},
    registration:      new Date().toISOString(),
    status:            true,
    labels:            [],
    passwordUpdate:    new Date().toISOString(),
    email:             "",
    phone:             "+910000000000",
    emailVerification: false,
    phoneVerification: false,
    mfa:               false,
    prefs:             {},
    targets:           [],
    accessedAt:        new Date().toISOString(),
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [status,  setStatus]  = useState<AuthStatus>("loading");
  const [user,    setUser]    = useState<Models.User<Models.Preferences> | null>(null);
  const [profile, setProfile] = useState<ProfileDocument | null>(null);

  const refresh = useCallback(async () => {
    setStatus("loading");

    // Guest session (phone + PIN flow, no SMS OTP) — works with or without Appwrite auth
    const guestSession = getMockSession();
    if (guestSession) {
      setUser(makeMockUser(guestSession.userId));
      setProfile(guestSession.profile);
      setStatus("authenticated");
      return;
    }

    if (IS_MOCK) {
      setUser(null);
      setProfile(null);
      setStatus("unauthenticated");
      return;
    }

    // Real Appwrite session
    try {
      const currentUser = await getSessionSafe();
      if (!currentUser) {
        setUser(null);
        setProfile(null);
        setStatus("unauthenticated");
        return;
      }
      setUser(currentUser);
      const prof = await getProfile(currentUser.$id);
      setProfile(prof);
      setStatus("authenticated");
    } catch {
      setUser(null);
      setProfile(null);
      setStatus("unauthenticated");
    }
  }, []);

  const logout = useCallback(async () => {
    clearMockSession();
    if (!IS_MOCK) {
      await appwriteLogout();
    }
    setUser(null);
    setProfile(null);
    setStatus("unauthenticated");
  }, []);

  const saveMockSession = useCallback((userId: string, prof: ProfileDocument) => {
    setMockSession({ userId, profile: prof });
    setUser(makeMockUser(userId));
    setProfile(prof);
    setStatus("authenticated");
  }, []);

  // On mount: restore session
  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <AuthContext.Provider
      value={{ status, user, profile, isMock: IS_MOCK, refresh, logout, setProfile, saveMockSession }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
