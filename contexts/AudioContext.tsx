"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { Howl, Howler } from "howler";
import { getFileViewUrl } from "@/lib/appwrite/storage";

// ─── Mock mode detection ──────────────────────────────────────────────────────
// When Appwrite is not configured, audio clips cannot load.
// In mock mode: playClip immediately fires onEnd (no auto-advance timer —
// per K1 decision: always show manual "अगला →" button instead).

const IS_MOCK =
  !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID === "your_project_id";

// ─── Context shape ────────────────────────────────────────────────────────────

type AudioContextValue = {
  /** Whether the audio context has been unlocked by a user gesture */
  audioUnlocked: boolean;
  /** Call on the first user gesture to unlock mobile audio */
  unlockAudio: () => void;
  /**
   * Play a narration clip by Appwrite file ID.
   * In mock mode: calls onEnd immediately (no audio plays).
   * Returns a stop handle.
   */
  playClip: (
    fileId: string,
    onEnd?: () => void,
    onError?: () => void,
    playbackRate?: number,
  ) => () => void;
  /** Stop all currently playing clips */
  stopAll: () => void;
  /** Whether any narration is currently playing */
  isPlaying: boolean;
  /** Preload a list of file IDs into the Howl cache */
  preload: (fileIds: string[]) => void;
  /** True when running without Appwrite — shows manual-advance UI */
  isMockMode: boolean;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const AudioContext = createContext<AudioContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AudioProvider({ children }: { children: React.ReactNode }) {
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [isPlaying, setIsPlaying]         = useState(false);
  const howlCache   = useRef<Map<string, Howl>>(new Map());
  const activeHowls = useRef<Set<Howl>>(new Set());

  // ── Mobile audio unlock ────────────────────────────────────────────────────

  const unlockAudio = useCallback(() => {
    if (audioUnlocked) return;
    Howler.volume(1);
    setAudioUnlocked(true);
  }, [audioUnlocked]);

  // ── Clip management ────────────────────────────────────────────────────────

  const getOrCreateHowl = useCallback((fileId: string): Howl => {
    if (howlCache.current.has(fileId)) {
      return howlCache.current.get(fileId)!;
    }
    const url  = getFileViewUrl(fileId);
    const howl = new Howl({
      src:     [url],
      html5:   true,
      format:  ["wav", "opus", "aac", "mp3", "m4a"],
      preload: true,
    });
    howlCache.current.set(fileId, howl);
    return howl;
  }, []);

  const playClip = useCallback(
    (
      fileId: string,
      onEnd?: () => void,
      onError?: () => void,
      playbackRate = 1,
    ): (() => void) => {
      if (IS_MOCK) {
        onError?.();
        return () => {};
      }

      if (!audioUnlocked) {
        onError?.();
        return () => {};
      }

      const howl = getOrCreateHowl(fileId);
      setIsPlaying(true);
      activeHowls.current.add(howl);

      const cleanup = () => {
        activeHowls.current.delete(howl);
        if (activeHowls.current.size === 0) setIsPlaying(false);
      };

      howl.once("end", () => {
        cleanup();
        onEnd?.();
      });

      howl.once("stop", cleanup);

      howl.once("loaderror", () => {
        cleanup();
        onError?.();
      });

      howl.once("playerror", () => {
        cleanup();
        onError?.();
      });

      howl.rate(playbackRate);
      howl.play();
      return () => howl.stop();
    },
    [audioUnlocked, getOrCreateHowl]
  );

  const stopAll = useCallback(() => {
    activeHowls.current.forEach((h) => h.stop());
    activeHowls.current.clear();
    setIsPlaying(false);
  }, []);

  const preload = useCallback(
    (fileIds: string[]) => {
      if (IS_MOCK) return; // nothing to preload in mock mode
      fileIds.forEach((id) => getOrCreateHowl(id));
    },
    [getOrCreateHowl]
  );

  useEffect(() => {
    return () => {
      howlCache.current.forEach((h) => h.unload());
    };
  }, []);

  return (
    <AudioContext.Provider
      value={{
        audioUnlocked,
        unlockAudio,
        playClip,
        stopAll,
        isPlaying,
        preload,
        isMockMode: IS_MOCK,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAudio(): AudioContextValue {
  const ctx = useContext(AudioContext);
  if (!ctx) throw new Error("useAudio must be used within AudioProvider");
  return ctx;
}
