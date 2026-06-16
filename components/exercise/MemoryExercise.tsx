'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNarration } from '@/lib/hooks/useNarration';
import type { MemoryExercise as MemoryExerciseType } from '@/lib/content/level1';
import PuppetGuide from '@/components/characters/PuppetGuide';

interface MemoryExerciseProps {
  exercise: MemoryExerciseType;
  exerciseIndex: number;
  totalExercises: number;
  onComplete(): void;
}

interface Card {
  id: number;
  letter: string;
  pairId: number;
}

type CardState = 'hidden' | 'flipped' | 'matched';

function buildPairs(letterPool: string[]): Card[] {
  // Cap at 6 pairs (12 cards), use first N letters from pool
  const maxPairs = 6;
  const letters = letterPool.slice(0, maxPairs);
  const cards: Card[] = [];
  letters.forEach((letter, pairId) => {
    cards.push({ id: pairId * 2, letter, pairId });
    cards.push({ id: pairId * 2 + 1, letter, pairId });
  });
  // Simple shuffle (deterministic enough for a game)
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor((i * 7 + 3) % (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export default function MemoryExercise({
  exercise,
  exerciseIndex,
  totalExercises,
  onComplete,
}: MemoryExerciseProps) {
  const [cards] = useState<Card[]>(() => buildPairs(exercise.letterPool));
  const [cardStates, setCardStates] = useState<CardState[]>(() =>
    new Array(buildPairs(exercise.letterPool).length).fill('hidden'),
  );
  // 3s initial reveal
  const [revealed, setRevealed] = useState(true);
  const [phase, setPhase] = useState<'narrating' | 'reveal' | 'playing' | 'done'>('narrating');
  const [flipped, setFlipped] = useState<number[]>([]);
  const [matchCount, setMatchCount] = useState(0);
  const mountedRef = useRef(true);
  const onCompleteRef = useRef(onComplete);
  const lockRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    onCompleteRef.current = onComplete;
    return () => { mountedRef.current = false; };
  });

  const narration = useNarration(exercise.promptAudio, exercise.speaker);

  // Start narration → 3s reveal → play
  useEffect(() => {
    const t = setTimeout(() => {
      narration.play(() => {
        if (!mountedRef.current) return;
        setPhase('reveal');
        setRevealed(true);
        setTimeout(() => {
          if (!mountedRef.current) return;
          setRevealed(false);
          setPhase('playing');
        }, 3000);
      });
    }, 300);
    return () => {
      clearTimeout(t);
      narration.stop();
    };
  // mount-only
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCardTap = (index: number) => {
    if (phase !== 'playing') return;
    if (lockRef.current) return;
    if (cardStates[index] !== 'hidden') return;
    if (flipped.includes(index)) return;

    const nextFlipped = [...flipped, index];
    setFlipped(nextFlipped);

    if (nextFlipped.length === 2) {
      lockRef.current = true;
      const [a, b] = nextFlipped;
      const isMatch = cards[a].pairId === cards[b].pairId;

      setTimeout(() => {
        if (!mountedRef.current) return;
        if (isMatch) {
          setCardStates(prev => {
            const next = [...prev];
            next[a] = 'matched';
            next[b] = 'matched';
            return next;
          });
          const newMatchCount = matchCount + 1;
          setMatchCount(newMatchCount);
          if (newMatchCount >= cards.length / 2) {
            setPhase('done');
            setTimeout(() => {
              if (mountedRef.current) onCompleteRef.current();
            }, 1500);
          }
        }
        setFlipped([]);
        lockRef.current = false;
      }, 900);
    }
  };

  const gridCols = cards.length <= 8 ? 'grid-cols-4' : 'grid-cols-4';

  return (
    <div className="fixed inset-0 bg-bg-twilight flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
        <PuppetGuide character={exercise.speaker} speaking={narration.isPlaying} size={60} />
        <div className="flex gap-2 items-center">
          {Array.from({ length: totalExercises }).map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all ${
                i < exerciseIndex
                  ? 'w-2 h-2 bg-firefly'
                  : i === exerciseIndex
                    ? 'w-3 h-3 bg-firefly'
                    : 'w-2 h-2 bg-surface/20'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Subtitle */}
      {narration.subtitle && (
        <div className="px-5 py-2">
          <p className="text-surface/75 font-mukta text-sm text-center">{narration.subtitle}</p>
        </div>
      )}

      {/* Phase label */}
      <div className="text-center py-1">
        {phase === 'reveal' && (
          <p className="text-firefly font-mukta text-sm animate-pulse">याद करो! ✨</p>
        )}
        {phase === 'done' && (
          <p className="text-firefly font-baloo2 text-xl">शाबाश! 🌟</p>
        )}
        {phase === 'playing' && (
          <p className="text-surface/40 font-mukta text-xs">
            {matchCount}/{cards.length / 2} जोड़े मिले
          </p>
        )}
      </div>

      {/* Card grid */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className={`grid ${gridCols} gap-3 w-full max-w-xs`}>
          {cards.map((card, i) => {
            const state = cardStates[i];
            const isFlipped = flipped.includes(i) || state === 'matched' || revealed;

            return (
              <motion.button
                key={card.id}
                onClick={() => handleCardTap(i)}
                disabled={state === 'matched' || phase === 'narrating'}
                whileTap={{ scale: 0.95 }}
                className={`aspect-square rounded-2xl flex items-center justify-center ${
                  state === 'matched'
                    ? 'bg-success/25 border border-success/40'
                    : 'bg-surface/10 border border-surface/20'
                }`}
              >
                <AnimatePresence mode="wait">
                  {isFlipped ? (
                    <motion.span
                      key="letter"
                      initial={{ rotateY: 90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: 90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={`text-3xl font-tiroDevanagariHindi ${
                        state === 'matched' ? 'text-success' : 'text-surface'
                      }`}
                    >
                      {card.letter}
                    </motion.span>
                  ) : (
                    <motion.span
                      key="back"
                      initial={{ rotateY: -90, opacity: 0 }}
                      animate={{ rotateY: 0, opacity: 1 }}
                      exit={{ rotateY: -90, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="text-xl text-surface/30"
                    >
                      ?
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
