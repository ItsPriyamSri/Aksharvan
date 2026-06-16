"use client";

// MatchBuildExercise — "शब्द बनाओ" word building game.
// Child taps letters in order to spell the target word.
// Shows letter buttons and a "tray" where selected letters appear.

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MatchBuildExercise as MatchBuildExerciseType, LetterCard } from "@/types/content";
import type { ExercisePhase } from "@/hooks/useExerciseState";

type Props = {
  exercise:  MatchBuildExerciseType;
  letterMap: Map<string, LetterCard>;
  phase:     ExercisePhase;
  onSuccess: () => void;
};

export default function MatchBuildExercise({ exercise, letterMap, phase, onSuccess }: Props) {
  const [tray, setTray] = useState<string[]>([]);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);

  const target = exercise.targetWords[0] ?? "";

  // Reset when phase changes back to answering
  useEffect(() => {
    if (phase === "answering") {
      setTray([]);
      setShake(false);
      setSuccess(false);
    }
  }, [phase]);

  const handleLetterTap = useCallback((letterId: string) => {
    if (success || phase !== "answering") return;
    const card = letterMap.get(letterId);
    if (!card) return;

    const nextTray = [...tray, card.glyph];
    const nextWord = nextTray.join("");

    setTray(nextTray);

    // Check if built word matches target
    if (nextWord === target) {
      setSuccess(true);
      setTimeout(onSuccess, 800);
      return;
    }

    // Check if impossible (too long or wrong prefix)
    if (nextTray.length >= target.length && nextWord !== target) {
      setShake(true);
      setTimeout(() => {
        setTray([]);
        setShake(false);
      }, 600);
    }
  }, [tray, target, letterMap, onSuccess, phase, success]);

  const handleClear = useCallback(() => {
    setTray([]);
    setShake(false);
  }, []);

  // The available letters are the unique letters in the target word from our pool
  // Only show letters that are in the target word (child-friendly, not random)
  const targetLetters = Array.from(new Set(target.split("")));
  const availableCards: LetterCard[] = [];
  for (const id of exercise.availableLetters) {
    const card = letterMap.get(id);
    if (card && targetLetters.includes(card.glyph)) {
      if (!availableCards.find((c) => c.glyph === card.glyph)) {
        availableCards.push(card);
      }
    }
  }

  // Show all letters needed for target, shuffled
  const shuffled = [...availableCards].sort(() => Math.random() - 0.5);
  // Use stable shuffle by seeding from target
  const stableShuffled = [...availableCards].sort((a, b) =>
    a.id.charCodeAt(0) - b.id.charCodeAt(0)
  );

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {/* Target word hint */}
      <div className="text-center">
        <p className="font-body text-surface/60 text-sm mb-1">यह शब्द बनाओ:</p>
        <p className="font-akshar text-4xl font-bold text-[var(--firefly)]">{target}</p>
      </div>

      {/* Letter tray — shows what child has tapped so far */}
      <motion.div
        animate={shake ? { x: [-8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.4 }}
        className={[
          "flex gap-2 min-h-[64px] min-w-[160px] px-4 py-3 rounded-2xl border-2 items-center justify-center",
          success
            ? "border-[var(--success)] bg-[var(--success)]/15"
            : tray.length > 0
            ? "border-[var(--firefly)]/60 bg-[var(--firefly)]/5"
            : "border-surface/20 bg-surface/5",
        ].join(" ")}
      >
        <AnimatePresence>
          {tray.length === 0 ? (
            <span className="font-body text-surface/30 text-sm">यहाँ शब्द बनेगा…</span>
          ) : (
            tray.map((glyph, i) => (
              <motion.span
                key={`${i}-${glyph}`}
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="akshar text-3xl font-bold"
                style={{ color: success ? "var(--success)" : "var(--surface)" }}
              >
                {glyph}
              </motion.span>
            ))
          )}
        </AnimatePresence>
        {success && (
          <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-2xl ml-1">✅</motion.span>
        )}
      </motion.div>

      {/* Letter buttons */}
      <div className="flex gap-3 flex-wrap justify-center">
        {stableShuffled.map((card) => (
          <motion.button
            key={card.id}
            type="button"
            onClick={() => handleLetterTap(card.id)}
            disabled={success || phase !== "answering"}
            whileTap={{ scale: 0.85 }}
            className={[
              "w-16 h-16 rounded-xl border-2 flex items-center justify-center",
              "font-akshar text-3xl font-bold transition-colors",
              success || phase !== "answering"
                ? "border-surface/15 text-surface/40 cursor-not-allowed"
                : "border-[var(--magic)]/50 bg-[var(--magic)]/10 text-surface hover:border-[var(--magic)] cursor-pointer",
            ].join(" ")}
          >
            {card.glyph}
          </motion.button>
        ))}
      </div>

      {/* Clear button */}
      {tray.length > 0 && !success && (
        <button type="button" onClick={handleClear}
          className="font-body text-surface/40 text-xs underline underline-offset-2 min-h-0 h-auto p-0">
          मिटाएं ✕
        </button>
      )}

      <AnimatePresence>
        {phase === "answering" && !success && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="font-body text-surface/40 text-xs text-center">
            अक्षर क्रम में टैप करें
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
