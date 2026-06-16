'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNarration } from '@/lib/hooks/useNarration';
import type { MatchBuildExercise as MatchBuildExerciseType } from '@/lib/content/level1';
import PuppetGuide from '@/components/characters/PuppetGuide';

interface MatchBuildExerciseProps {
  exercise: MatchBuildExerciseType;
  exerciseIndex: number;
  totalExercises: number;
  onComplete(): void;
}

interface TappedLetter {
  letter: string;
  tileIndex: number;
}

export default function MatchBuildExercise({
  exercise,
  exerciseIndex,
  totalExercises,
  onComplete,
}: MatchBuildExerciseProps) {
  const [tapped, setTapped] = useState<TappedLetter[]>([]);
  const [phase, setPhase] = useState<'narrating' | 'tapping' | 'done'>('narrating');
  const [sparkle, setSparkle] = useState(false);
  const mountedRef = useRef(true);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    mountedRef.current = true;
    onCompleteRef.current = onComplete;
    return () => { mountedRef.current = false; };
  });

  const narration = useNarration(exercise.promptAudio, exercise.speaker);

  // Start narration on mount
  useEffect(() => {
    const t = setTimeout(() => {
      narration.play(() => {
        if (mountedRef.current) setPhase('tapping');
      });
    }, 300);
    return () => {
      clearTimeout(t);
      narration.stop();
    };
  // mount-only
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTap = (letter: string, tileIndex: number) => {
    if (phase !== 'tapping') return;
    const alreadyTapped = tapped.some(t => t.tileIndex === tileIndex);
    if (alreadyTapped) return;

    const next = [...tapped, { letter, tileIndex }];
    setTapped(next);

    if (next.length >= exercise.minToPass) {
      setSparkle(true);
      setPhase('done');
      setTimeout(() => {
        if (mountedRef.current) onCompleteRef.current();
      }, 1800);
    }
  };

  const handleUndo = () => {
    if (tapped.length === 0 || phase !== 'tapping') return;
    setTapped(prev => prev.slice(0, -1));
  };

  const builtWord = tapped.map(t => t.letter).join('');
  const canSubmit = tapped.length >= exercise.minToPass && phase === 'tapping';

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
          <p className="text-surface/75 font-mukta text-sm text-center leading-relaxed">
            {narration.subtitle}
          </p>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-8">
        {/* Built word display */}
        <div className="flex gap-2 min-h-[72px] items-center justify-center">
          <AnimatePresence>
            {tapped.map((t, i) => (
              <motion.div
                key={`${t.tileIndex}-${i}`}
                initial={{ opacity: 0, scale: 0.5, y: -20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  sparkle ? 'bg-firefly' : 'bg-magic/30 border border-magic/50'
                }`}
              >
                <span className="text-3xl font-tiroDevanagariHindi text-surface">{t.letter}</span>
              </motion.div>
            ))}
            {tapped.length === 0 && (
              <p className="text-surface/30 font-mukta text-sm">अक्षर छूओ</p>
            )}
          </AnimatePresence>
        </div>

        {/* Sparkle feedback */}
        <AnimatePresence>
          {sparkle && (
            <motion.p
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-firefly font-baloo2 text-3xl text-center"
            >
              {builtWord} — शाबाश! ✨
            </motion.p>
          )}
        </AnimatePresence>

        {/* Letter tile grid */}
        <div className="flex flex-wrap gap-3 justify-center max-w-xs">
          {exercise.availableLetters.map((letter, i) => {
            const alreadyTapped = tapped.some(t => t.tileIndex === i);
            return (
              <motion.button
                key={i}
                whileTap={{ scale: alreadyTapped ? 1 : 0.9 }}
                onClick={() => handleTap(letter, i)}
                disabled={phase !== 'tapping' || alreadyTapped}
                className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                  alreadyTapped
                    ? 'bg-surface/10 border border-surface/10 opacity-40'
                    : 'bg-surface/15 border border-surface/30 active:bg-surface/25'
                }`}
              >
                <span className="text-4xl font-tiroDevanagariHindi text-surface">
                  {letter}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Controls */}
        <div className="flex gap-4">
          {tapped.length > 0 && phase === 'tapping' && (
            <button
              onClick={handleUndo}
              className="px-4 py-2 rounded-xl bg-surface/10 text-surface/60 font-mukta text-sm"
            >
              ← मिटाओ
            </button>
          )}
          {canSubmit && (
            <button
              onClick={() => {
                setSparkle(true);
                setPhase('done');
                setTimeout(() => {
                  if (mountedRef.current) onCompleteRef.current();
                }, 1800);
              }}
              className="px-6 py-2 rounded-xl bg-firefly text-ink font-baloo2 text-base"
            >
              बना दिया! →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
