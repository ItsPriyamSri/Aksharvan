"use client";

// ProgressContext — per-level progress with localStorage mock persistence.
// In mock mode, progress is persisted to localStorage so it survives navigation.

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import type { ProgressState } from "@/types/progress";
import { initialProgressState } from "@/types/progress";
import { getOrCreateProgress, saveProgress } from "@/lib/appwrite/progress";
import { useAuth } from "./AuthContext";
import { DEFAULT_LEVEL_ID } from "@/lib/content/registry";

const IS_MOCK =
  !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID === "your_project_id";

function mockProgressKey(userId: string, levelId: string) {
  return `aksharvan_progress_${userId}_${levelId}`;
}

function getMockProgress(userId: string, levelId: string): ProgressState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(mockProgressKey(userId, levelId));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setMockProgress(userId: string, levelId: string, state: ProgressState) {
  if (typeof window === "undefined") return;
  localStorage.setItem(mockProgressKey(userId, levelId), JSON.stringify(state));
}

// ─── Context shape ────────────────────────────────────────────────────────────

type ProgressContextValue = {
  levelId: string;
  progress: ProgressState | null;
  isLoading: boolean;
  markIntroSeen: () => Promise<void>;
  markExerciseDone: (sublevelIndex: number, exercisesDone: number) => Promise<void>;
  completeSublevel: (sublevelIndex: number) => Promise<void>;
  getActiveSublevelIndex: () => number;
  resetProgress: () => Promise<void>;
};

const ProgressContext = createContext<ProgressContextValue | null>(null);

type ProgressProviderProps = {
  children: React.ReactNode;
  levelId?: string;
};

export function ProgressProvider({
  children,
  levelId = DEFAULT_LEVEL_ID,
}: ProgressProviderProps) {
  const { user, status } = useAuth();
  const [progress, setProgress] = useState<ProgressState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (status === "loading") return;
    if (status !== "authenticated" || !user) {
      setProgress(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    if (IS_MOCK) {
      // Restore from localStorage or create fresh
      const existing = getMockProgress(user.$id, levelId);
      setProgress(existing ?? initialProgressState());
      setIsLoading(false);
      return;
    }

    getOrCreateProgress(user.$id, levelId)
      .then(({ state }) => setProgress(state))
      .catch(() => setProgress(initialProgressState()))
      .finally(() => setIsLoading(false));
  }, [user, status, levelId]);

  const save = useCallback(
    async (next: ProgressState) => {
      setProgress(next);
      if (!user) return;
      if (IS_MOCK) {
        setMockProgress(user.$id, levelId, next);
        return;
      }
      await saveProgress(user.$id, levelId, next).catch(console.error);
    },
    [user, levelId]
  );

  const markIntroSeen = useCallback(async () => {
    if (!progress || progress.hasSeenIntro) return;
    await save({ ...progress, hasSeenIntro: true });
  }, [progress, save]);

  const markExerciseDone = useCallback(
    async (sublevelIndex: number, exercisesDone: number) => {
      if (!progress) return;
      await save({
        ...progress,
        sublevels: progress.sublevels.map((sl) =>
          sl.index === sublevelIndex ? { ...sl, exercisesDone } : sl
        ),
      });
    },
    [progress, save]
  );

  const completeSublevel = useCallback(
    async (sublevelIndex: number) => {
      if (!progress) return;
      await save({
        ...progress,
        sublevels: progress.sublevels.map((sl) => {
          if (sl.index === sublevelIndex)     return { ...sl, status: "completed", exercisesDone: 7 };
          if (sl.index === sublevelIndex + 1) return { ...sl, status: "active" };
          return sl;
        }),
        restorationStage: sublevelIndex + 1,
      });
    },
    [progress, save]
  );

  const getActiveSublevelIndex = useCallback((): number => {
    if (!progress) return 0;
    return progress.sublevels.find((sl) => sl.status === "active")?.index ?? 0;
  }, [progress]);

  const resetProgress = useCallback(async () => {
    const fresh = initialProgressState();
    await save(fresh);
  }, [save]);

  return (
    <ProgressContext.Provider
      value={{
        levelId,
        progress,
        isLoading,
        markIntroSeen,
        markExerciseDone,
        completeSublevel,
        getActiveSublevelIndex,
        resetProgress,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
