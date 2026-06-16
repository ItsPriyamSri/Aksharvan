"use client";

// ShotSequencePlayer — plays a series of illustrated shots with narration.
// Used for future level backstory cutscenes (not the MP4 intro).
//
// Each Shot:
//   • illustrated image (Appwrite storage URL or local path)
//   • narration audio clip (played via Howler)
//   • optional Hindi caption
//   • Ken-Burns motion (subtle pan/zoom via Framer Motion)
//
// In mock/audio-missing mode: shows a "अगला →" button per shot.
// With audio: auto-advances when narration ends.

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAudio } from "@/contexts/AudioContext";

// ─── Types ────────────────────────────────────────────────────────────────────

export type CutsceneShot = {
  id: string;
  /** Image URL (Appwrite storage or local /public path) */
  imageSrc: string;
  imageAlt: string;
  /** Appwrite audio file ID — played via Howler */
  audioId?: string;
  /** Hindi caption shown at bottom */
  captionHi?: string;
  /** Ken-Burns direction */
  kenBurns?: "zoom-in" | "zoom-out" | "pan-left" | "pan-right";
  /** Duration in ms — used as fallback when audio is missing */
  fallbackDurationMs?: number;
};

type ShotSequencePlayerProps = {
  shots: CutsceneShot[];
  onComplete: () => void;
  /** Label for skip button */
  skipLabel?: string;
};

// ─── Ken-Burns motion variants ────────────────────────────────────────────────

const KB_VARIANTS: Record<
  NonNullable<CutsceneShot["kenBurns"]>,
  { initial: object; animate: object }
> = {
  "zoom-in":    { initial: { scale: 1, x: 0, y: 0 },    animate: { scale: 1.08 } },
  "zoom-out":   { initial: { scale: 1.08, x: 0, y: 0 }, animate: { scale: 1 } },
  "pan-left":   { initial: { scale: 1.06, x: 0 },        animate: { x: "-4%" } },
  "pan-right":  { initial: { scale: 1.06, x: 0 },        animate: { x: "4%" } },
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function ShotSequencePlayer({
  shots,
  onComplete,
  skipLabel = "छोड़ें",
}: ShotSequencePlayerProps) {
  const { playClip, isMockMode } = useAudio();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [skipConfirm, setSkipConfirm]   = useState(false);
  const stopRef = useRef<(() => void) | null>(null);

  const currentShot = shots[currentIndex];
  const isLast      = currentIndex === shots.length - 1;

  // ── Advance to next shot ───────────────────────────────────────────────────

  const advance = useCallback(() => {
    stopRef.current?.();
    if (isLast) {
      onComplete();
    } else {
      setCurrentIndex((i) => i + 1);
    }
  }, [isLast, onComplete]);

  // ── Play narration for current shot ───────────────────────────────────────

  useEffect(() => {
    if (!currentShot) return;

    // In mock mode: do NOT auto-advance (K1 decision — manual button shown)
    if (isMockMode || !currentShot.audioId) {
      return;
    }

    // Play clip; auto-advance on end
    const stop = playClip(currentShot.audioId, () => {
      // Small pause after narration before advancing
      const t = setTimeout(advance, 400);
      return () => clearTimeout(t);
    });
    stopRef.current = stop;

    return () => {
      stop();
      stopRef.current = null;
    };
  }, [currentIndex, currentShot, isMockMode, playClip, advance]);

  // ── Skip handling (two-tap confirm) ───────────────────────────────────────

  const handleSkip = useCallback(() => {
    if (!skipConfirm) {
      setSkipConfirm(true);
      setTimeout(() => setSkipConfirm(false), 2000);
      return;
    }
    stopRef.current?.();
    onComplete();
  }, [skipConfirm, onComplete]);

  if (!currentShot) return null;

  const kbKey    = currentShot.kenBurns ?? "zoom-in";
  const kbMotion = KB_VARIANTS[kbKey];

  return (
    <div className="relative h-dvh w-full bg-black overflow-hidden">
      {/* ── Illustrated shot ─────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentShot.id}
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Ken-Burns image */}
          <motion.img
            src={currentShot.imageSrc}
            alt={currentShot.imageAlt}
            className="absolute inset-0 w-full h-full object-cover"
            initial={kbMotion.initial as Record<string, number | string>}
            animate={kbMotion.animate as Record<string, number | string>}
            transition={{ duration: 8, ease: "linear" }}
          />

          {/* Dark gradient at bottom for caption readability */}
          <div className="absolute bottom-0 left-0 right-0 h-1/3
                          bg-gradient-to-t from-black/80 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* ── Caption ──────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {currentShot.captionHi && (
          <motion.div
            key={`caption-${currentShot.id}`}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, delay: 0.3 }}
            className="absolute bottom-20 left-0 right-0 px-6 z-10 text-center"
          >
            <p className="font-body text-white text-lg font-medium leading-deva
                          drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
              {currentShot.captionHi}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Shot counter dots ─────────────────────────────────────────── */}
      <div className="absolute top-safe left-0 right-0 pt-4 flex justify-center gap-2 z-10">
        {shots.map((_, i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full transition-all duration-300"
            style={{
              background: i === currentIndex
                ? "var(--firefly)"
                : i < currentIndex
                ? "rgba(255,200,74,0.5)"
                : "rgba(255,255,255,0.25)",
              width: i === currentIndex ? "24px" : "8px",
            }}
          />
        ))}
      </div>

      {/* ── Controls row ─────────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 pb-safe pb-6 px-5 z-10
                      flex items-center justify-between">
        {/* Mock mode: manual next button (K1) */}
        {(isMockMode || !currentShot.audioId) && (
          <motion.button
            type="button"
            onClick={advance}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="btn-primary flex items-center gap-2"
          >
            {isLast ? "शुरू करें" : "अगला"}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </motion.button>
        )}

        {/* Spacer when no next button */}
        {!isMockMode && currentShot.audioId && <div />}

        {/* Skip */}
        <button
          type="button"
          onClick={handleSkip}
          className={[
            "flex items-center gap-2 px-4 py-2 rounded-full font-body text-sm",
            "font-semibold transition-colors min-h-[44px]",
            skipConfirm
              ? "bg-[var(--firefly)] text-ink"
              : "bg-black/40 text-white border border-white/30",
          ].join(" ")}
        >
          {skipConfirm ? "पक्का?" : skipLabel}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5">
            <polyline points="13 17 18 12 13 7" />
            <polyline points="6 17 11 12 6 7" />
          </svg>
        </button>
      </div>

      {/* ── Mock mode indicator (K2) ─────────────────────────────────── */}
      {isMockMode && process.env.NODE_ENV === "development" && (
        <div className="absolute top-safe right-4 pt-4 z-10">
          <div className="px-2 py-1 rounded bg-[var(--magic)]/60 font-body text-white text-xs">
            🔇 Audio Placeholder Mode
          </div>
        </div>
      )}
    </div>
  );
}
