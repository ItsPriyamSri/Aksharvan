"use client";

// SpeakerContext — tracks Tina/Toto strict alternation (H1, H3 decisions).
//
// Alternation model (confirmed H3):
//   Tina asks → child answers → Toto praises → Toto asks next
//   Toto asks → child answers → Tina praises → Tina asks next
//
// So: asker = activeSpeaker. After correct answer → praiser = OTHER character
// → then OTHER character becomes next asker.
// Net effect: activeSpeaker flips on each correct answer.

import React, { createContext, useContext, useState, useCallback } from "react";
import type { SpeakerCharacter } from "@/types/audio";

// ─── Context shape ────────────────────────────────────────────────────────────

type SpeakerContextValue = {
  /** The character currently asking / speaking */
  activeSpeaker: SpeakerCharacter;
  /** The character who is listening (will praise + ask next) */
  listeningCharacter: SpeakerCharacter;
  /**
   * Call after a correct answer.
   * Flips: the listener becomes the new asker.
   * This triggers the speaking glow to switch.
   */
  advanceSpeaker: () => void;
  /** Explicitly set (e.g. at level start) */
  setSpeaker: (s: SpeakerCharacter) => void;
};

// ─── Context ──────────────────────────────────────────────────────────────────

const SpeakerContext = createContext<SpeakerContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function SpeakerProvider({ children }: { children: React.ReactNode }) {
  // Tina always starts as the first asker (per ALfA book: "टीना पूछे")
  const [activeSpeaker, setActiveSpeaker] = useState<SpeakerCharacter>("tina");

  const listeningCharacter: SpeakerCharacter =
    activeSpeaker === "tina" ? "toto" : "tina";

  const advanceSpeaker = useCallback(() => {
    setActiveSpeaker((prev) => (prev === "tina" ? "toto" : "tina"));
  }, []);

  const setSpeaker = useCallback((s: SpeakerCharacter) => {
    setActiveSpeaker(s);
  }, []);

  return (
    <SpeakerContext.Provider
      value={{ activeSpeaker, listeningCharacter, advanceSpeaker, setSpeaker }}
    >
      {children}
    </SpeakerContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSpeaker(): SpeakerContextValue {
  const ctx = useContext(SpeakerContext);
  if (!ctx) throw new Error("useSpeaker must be used within SpeakerProvider");
  return ctx;
}
