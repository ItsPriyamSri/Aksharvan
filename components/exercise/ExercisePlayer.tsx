'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNarration } from '@/lib/hooks/useNarration';
import { useASR } from '@/lib/hooks/useASR';
import type { Exercise, NameObjectExercise, FirstSoundExercise, BlendExercise } from '@/lib/content/level1';
import PuppetGuide from '@/components/characters/PuppetGuide';
import MicIndicator from '@/components/audio/MicIndicator';
import MatchBuildExercise from '@/components/exercise/MatchBuildExercise';
import MemoryExercise from '@/components/exercise/MemoryExercise';
import { getObjectImageUrl } from '@/lib/appwrite/services/assets';

type Phase = 'narrating' | 'listening' | 'thinking' | 'correct' | 'wrong' | 'hint' | 'reveal' | 'done';

interface ExercisePlayerProps {
  exercise: Exercise;
  exerciseIndex: number;
  totalExercises: number;
  onComplete(): void;
}

function isVoiceExercise(ex: Exercise): ex is NameObjectExercise | FirstSoundExercise | BlendExercise {
  return ex.type === 'name_object' || ex.type === 'first_sound' || ex.type === 'blend';
}

function getExpected(ex: Exercise): string[] {
  if (isVoiceExercise(ex)) return ex.expected;
  return [];
}

function getCorrectAnswer(ex: Exercise): string {
  if (isVoiceExercise(ex)) return ex.correct;
  return '';
}

function ObjectDisplay({ ex }: { ex: NameObjectExercise | FirstSoundExercise }) {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <div className="w-52 h-52 rounded-3xl bg-surface/10 border border-surface/20 overflow-hidden flex items-center justify-center">
      {!imgFailed ? (
        <img
          src={getObjectImageUrl(ex.object.id)}
          alt={ex.object.nameHi}
          className="w-full h-full object-cover"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span className="text-7xl">{ex.object.nameHi[0]}</span>
      )}
    </div>
  );
}

function BlendDisplay({ ex }: { ex: BlendExercise }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-20 h-20 rounded-2xl bg-tina/20 border border-tina/30 flex items-center justify-center">
        <span className="text-5xl font-tiroDevanagariHindi text-surface">{ex.obj1.letter}</span>
      </div>
      <span className="text-surface/50 text-3xl font-mukta">+</span>
      <div className="w-20 h-20 rounded-2xl bg-toto/20 border border-toto/30 flex items-center justify-center">
        <span className="text-5xl font-tiroDevanagariHindi text-surface">{ex.obj2.letter}</span>
      </div>
      <span className="text-surface/50 text-3xl font-mukta">=</span>
      <div className="w-20 h-20 rounded-2xl bg-surface/10 border border-surface/20 flex items-center justify-center">
        <span className="text-surface/30 font-tiroDevanagariHindi text-4xl">?</span>
      </div>
    </div>
  );
}

export default function ExercisePlayer({
  exercise,
  exerciseIndex,
  totalExercises,
  onComplete,
}: ExercisePlayerProps) {
  const [phase, setPhase] = useState<Phase>('narrating');
  const [failCount, setFailCount] = useState(0);
  const mountedRef = useRef(true);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    mountedRef.current = true;
    onCompleteRef.current = onComplete;
    return () => { mountedRef.current = false; };
  });

  const promptNarration = useNarration(exercise.promptAudio, exercise.speaker);
  const hintNarration = useNarration(`nudge_try_again__${exercise.speaker}`, exercise.speaker);

  const handleASRResult = useCallback((matched: boolean) => {
    if (!mountedRef.current) return;
    if (matched) {
      setPhase('correct');
    } else {
      setFailCount((prev) => {
        const next = prev + 1;
        setPhase(next >= 2 ? 'hint' : 'wrong');
        return next;
      });
    }
  }, []);

  const asr = useASR(getExpected(exercise), exercise.promptAudio, handleASRResult);
  const armRef = useRef(asr.arm);
  useEffect(() => { armRef.current = asr.arm; });

  // Start narration on mount (voice exercises only)
  useEffect(() => {
    if (!isVoiceExercise(exercise)) return;

    const t = setTimeout(() => {
      promptNarration.play(() => {
        if (!mountedRef.current) return;
        setPhase('listening');
        armRef.current();
      });
    }, 300);
    return () => {
      clearTimeout(t);
      promptNarration.stop();
      asr.stop();
    };
  // mount-only
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Wrong (first fail) → re-arm after brief pause
  useEffect(() => {
    if (phase !== 'wrong') return;
    const t = setTimeout(() => {
      if (!mountedRef.current) return;
      setPhase('listening');
      armRef.current();
    }, 1500);
    return () => clearTimeout(t);
  }, [phase]);

  // Hint → play nudge → show reveal → auto-advance
  useEffect(() => {
    if (phase !== 'hint') return;
    hintNarration.play(() => {
      if (!mountedRef.current) return;
      setPhase('reveal');
      setTimeout(() => {
        if (mountedRef.current) onCompleteRef.current();
      }, 3000);
    });
    return () => hintNarration.stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Correct → celebrate briefly → advance
  useEffect(() => {
    if (phase !== 'correct') return;
    const t = setTimeout(() => {
      if (mountedRef.current) onCompleteRef.current();
    }, 1800);
    return () => clearTimeout(t);
  }, [phase]);

  const isSpeaking = promptNarration.isPlaying || hintNarration.isPlaying;

  // match_build — full tap implementation (E6)
  if (exercise.type === 'match_build') {
    return (
      <MatchBuildExercise
        exercise={exercise}
        exerciseIndex={exerciseIndex}
        totalExercises={totalExercises}
        onComplete={onComplete}
      />
    );
  }

  // memory — full tap implementation (E7)
  if (exercise.type === 'memory') {
    return (
      <MemoryExercise
        exercise={exercise}
        exerciseIndex={exerciseIndex}
        totalExercises={totalExercises}
        onComplete={onComplete}
      />
    );
  }

  const correct = getCorrectAnswer(exercise);

  return (
    <div className="fixed inset-0 bg-bg-twilight flex flex-col">
      {/* Header: character + progress dots */}
      <div className="flex items-center justify-between px-5 pt-6 pb-2">
        <PuppetGuide character={exercise.speaker} speaking={isSpeaking} size={60} />
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

      {/* Narration subtitle */}
      <AnimatePresence>
        {(promptNarration.subtitle || hintNarration.subtitle) && (
          <motion.div
            key={isSpeaking ? 'sub' : 'none'}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="px-5 py-2"
          >
            <p className="text-surface/75 font-mukta text-sm text-center leading-relaxed">
              {hintNarration.isPlaying ? hintNarration.subtitle : promptNarration.subtitle}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Exercise content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 gap-6">
        {exercise.type !== 'blend' ? (
          <ObjectDisplay ex={exercise as NameObjectExercise | FirstSoundExercise} />
        ) : (
          <BlendDisplay ex={exercise as BlendExercise} />
        )}

        {/* Prompt label */}
        <p className="text-surface/60 font-mukta text-base text-center">
          {exercise.type === 'name_object' && 'यह क्या है?'}
          {exercise.type === 'first_sound' && 'पहली आवाज़ क्या है?'}
          {exercise.type === 'blend' && 'इन्हें जोड़ो — कौन सा शब्द बना?'}
        </p>

        {/* Correct answer reveal */}
        <AnimatePresence>
          {phase === 'reveal' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-success/15 border border-success/30 rounded-2xl px-8 py-4 text-center"
            >
              <p className="text-surface/50 font-mukta text-xs mb-1">सही जवाब</p>
              <p className="text-surface font-tiroDevanagariHindi text-5xl">{correct}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Correct celebration */}
        <AnimatePresence>
          {phase === 'correct' && (
            <motion.p
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-firefly font-baloo2 text-3xl text-center"
            >
              शाबाश! ✨
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Mic indicator */}
      <div className="pb-12 flex justify-center min-h-[100px] items-center">
        {(phase === 'listening' || phase === 'thinking' || phase === 'wrong') && (
          <MicIndicator
            state={phase === 'thinking' ? 'thinking' : phase === 'wrong' ? 'result' : 'listening'}
            matched={phase === 'wrong' ? false : null}
          />
        )}
        {phase === 'narrating' && (
          <div className="w-2 h-2 rounded-full bg-surface/20 animate-pulse" />
        )}
      </div>
    </div>
  );
}
