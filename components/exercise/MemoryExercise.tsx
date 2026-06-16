"use client";

// MemoryExercise — "एक जैसे अक्षर ढूँढो" memory matching game.
// Cards are revealed briefly, then flipped face-down.
// Child taps pairs of matching letter cards.

import React, { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { MemoryExercise as MemoryExerciseType, LetterCard } from "@/types/content";
import type { ExercisePhase } from "@/hooks/useExerciseState";

type Props = {
  exercise:  MemoryExerciseType;
  letterMap: Map<string, LetterCard>;
  phase:     ExercisePhase;
  onSuccess: () => void;
};

type CardState = {
  id:      string;  // unique card instance id (letter.id + "-" + 0|1)
  letter:  LetterCard;
  flipped: boolean;
  matched: boolean;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function MemoryExercise({ exercise, letterMap, phase, onSuccess }: Props) {
  const maxPairs = Math.min(exercise.maxPairs, exercise.letterPool.length);

  // Build the card grid from the letter pool
  const buildCards = useCallback((): CardState[] => {
    const pool = exercise.letterPool
      .slice(0, maxPairs)
      .map((id) => letterMap.get(id))
      .filter(Boolean) as LetterCard[];

    const pairs: CardState[] = [];
    for (const letter of pool) {
      pairs.push({ id: `${letter.id}-0`, letter, flipped: true,  matched: false });
      pairs.push({ id: `${letter.id}-1`, letter, flipped: true,  matched: false });
    }
    return shuffle(pairs);
  }, [exercise.letterPool, maxPairs, letterMap]);

  const [cards, setCards]         = useState<CardState[]>(buildCards);
  const [selected, setSelected]   = useState<string[]>([]);
  const [isRevealing, setIsRevealing] = useState(true);
  const [matchCount, setMatchCount]   = useState(0);
  const lockRef = useRef(false);

  // Initial reveal phase
  useEffect(() => {
    const t = setTimeout(() => {
      setCards((prev) => prev.map((c) => ({ ...c, flipped: false })));
      setIsRevealing(false);
    }, exercise.revealMs);
    return () => clearTimeout(t);
  }, [exercise.revealMs]);

  // Reset when phase becomes answering again (re-entry)
  useEffect(() => {
    if (phase === "answering" && !isRevealing) {
      // Don't reset mid-game
    }
  }, [phase, isRevealing]);

  const handleTap = useCallback((cardId: string) => {
    if (lockRef.current || isRevealing || phase !== "answering") return;
    const card = cards.find((c) => c.id === cardId);
    if (!card || card.flipped || card.matched) return;
    if (selected.includes(cardId)) return;

    const newSelected = [...selected, cardId];
    setCards((prev) => prev.map((c) => c.id === cardId ? { ...c, flipped: true } : c));

    if (newSelected.length === 2) {
      lockRef.current = true;
      setSelected([]);

      const [a, b] = newSelected.map((id) => cards.find((c) => c.id === id)!);
      const isMatch = a.letter.id === b.letter.id;

      setTimeout(() => {
        if (isMatch) {
          setCards((prev) =>
            prev.map((c) => newSelected.includes(c.id) ? { ...c, matched: true } : c)
          );
          const newCount = matchCount + 1;
          setMatchCount(newCount);
          if (newCount >= maxPairs) {
            setTimeout(onSuccess, 500);
          }
        } else {
          setCards((prev) =>
            prev.map((c) => newSelected.includes(c.id) ? { ...c, flipped: false } : c)
          );
        }
        lockRef.current = false;
      }, 900);

      setSelected(newSelected);
    } else {
      setSelected(newSelected);
    }
  }, [cards, selected, matchCount, maxPairs, isRevealing, phase, onSuccess]);

  const cols = maxPairs <= 3 ? maxPairs * 2 : 4;

  return (
    <div className="flex flex-col items-center gap-4 w-full">
      {/* Score */}
      <div className="flex items-center gap-2">
        <span className="font-body text-surface/60 text-sm">जोड़े:</span>
        <span className="font-display text-[var(--firefly)] font-bold text-lg">
          {matchCount}/{maxPairs}
        </span>
      </div>

      {/* Grid */}
      <div
        className="grid gap-2 w-full"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {cards.map((card) => (
          <motion.button
            key={card.id}
            type="button"
            onClick={() => handleTap(card.id)}
            disabled={card.matched || isRevealing}
            whileTap={!card.flipped && !card.matched ? { scale: 0.92 } : {}}
            className={[
              "aspect-square rounded-xl border-2 flex items-center justify-center",
              "transition-colors duration-200 min-h-[52px]",
              card.matched
                ? "border-[var(--success)]/60 bg-[var(--success)]/15 cursor-default"
                : card.flipped
                ? "border-[var(--firefly)]/60 bg-[var(--firefly)]/10"
                : "border-surface/20 bg-[var(--magic)]/10 cursor-pointer hover:border-[var(--magic)]/60",
            ].join(" ")}
          >
            <AnimatePresence mode="wait">
              {card.flipped || card.matched ? (
                <motion.span
                  key="front"
                  initial={{ rotateY: 90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: 90, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="akshar text-2xl font-bold"
                  style={{ color: card.matched ? "var(--success)" : "var(--surface)" }}
                >
                  {card.letter.glyph}
                </motion.span>
              ) : (
                <motion.span
                  key="back"
                  initial={{ rotateY: -90, opacity: 0 }}
                  animate={{ rotateY: 0, opacity: 1 }}
                  exit={{ rotateY: -90, opacity: 0 }}
                  transition={{ duration: 0.18 }}
                  className="text-xl"
                >
                  ⭐
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        ))}
      </div>

      <AnimatePresence>
        {isRevealing && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="font-body text-[var(--firefly)] text-sm font-semibold">
            याद करो… {(exercise.revealMs / 1000).toFixed(0)} सेकंड
          </motion.p>
        )}
        {!isRevealing && phase === "answering" && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="font-body text-surface/40 text-xs">
            एक जैसे अक्षर ढूँढकर टैप करें
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
