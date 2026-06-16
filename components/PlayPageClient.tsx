'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { useProgress } from '@/lib/hooks/useProgress';
import { level1 } from '@/lib/content/level1';
import type { ExtendedProgressState } from '@/lib/appwrite/services/progress';
import ExercisePlayer from '@/components/exercise/ExercisePlayer';
import { getForestStageUrl } from '@/lib/appwrite/services/assets';

interface PlayPageClientProps {
  levelId: string;
}

type Screen = 'loading' | 'exercise' | 'restoration' | 'complete';

interface LocalState {
  sublevelIndex: number;
  exerciseIndex: number;
}

export default function PlayPageClient({ levelId: _levelId }: PlayPageClientProps) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { state, loading: progressLoading, saveProgress } = useProgress();
  const [screen, setScreen] = useState<Screen>('loading');
  const [local, setLocal] = useState<LocalState>({ sublevelIndex: 0, exerciseIndex: 0 });
  // Prevent re-initialisation from context state changes after first load
  const initializedRef = useRef(false);
  const savingRef = useRef(false);

  // Auth guard
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  // One-time initialisation from persisted progress state
  useEffect(() => {
    if (authLoading || progressLoading || !user || !state) return;
    if (initializedRef.current) return;
    initializedRef.current = true;
    setLocal({
      sublevelIndex: state.currentSublevelIndex ?? 0,
      exerciseIndex: state.currentExerciseIndex ?? 0,
    });
    setScreen('exercise');
  }, [authLoading, progressLoading, user, state]);

  const handleExerciseComplete = useCallback(async () => {
    if (!state || savingRef.current) return;
    savingRef.current = true;

    const { sublevelIndex, exerciseIndex } = local;
    const sublevel = level1.sublevels[sublevelIndex];
    const nextExercise = exerciseIndex + 1;

    if (nextExercise >= sublevel.exercises.length) {
      // Sublevel complete — update sublevels array and advance
      const newSublevels = state.sublevels.map((sl, i) =>
        i === sublevelIndex
          ? { ...sl, status: 'completed' as const, exercisesDone: sublevel.exercises.length }
          : sl,
      );
      const nextSublevel = sublevelIndex + 1;
      const allDone = nextSublevel >= level1.sublevels.length;

      const updated: ExtendedProgressState = {
        ...state,
        sublevels: newSublevels,
        restorationStage: nextSublevel,
        currentSublevelIndex: allDone ? sublevelIndex : nextSublevel,
        currentExerciseIndex: 0,
      };

      await saveProgress(updated);
      savingRef.current = false;

      if (allDone) {
        setScreen('complete');
      } else {
        setLocal({ sublevelIndex: nextSublevel, exerciseIndex: 0 });
        setScreen('restoration');
      }
    } else {
      // Next exercise in same sublevel
      const updated: ExtendedProgressState = {
        ...state,
        currentSublevelIndex: sublevelIndex,
        currentExerciseIndex: nextExercise,
      };
      await saveProgress(updated);
      savingRef.current = false;
      setLocal({ sublevelIndex, exerciseIndex: nextExercise });
    }
  }, [state, local, saveProgress]);

  const handleRestorationDone = useCallback(() => {
    setScreen('exercise');
  }, []);

  if (authLoading || !user || screen === 'loading') {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-bg-twilight">
        <div className="w-8 h-8 rounded-full border-4 border-firefly border-t-transparent animate-spin" />
      </div>
    );
  }

  if (screen === 'complete') {
    return (
      <div className="fixed inset-0 bg-bg-twilight flex flex-col items-center justify-center gap-6 px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <p className="text-firefly font-baloo2 text-4xl mb-2">शाबाश! 🌟</p>
          <p className="text-surface/70 font-mukta text-lg">तुमने जंगल बचा लिया!</p>
        </motion.div>
        <button
          onClick={() => router.replace('/map')}
          className="bg-firefly text-ink font-baloo2 text-xl px-8 py-3 rounded-2xl active:scale-95 transition-transform"
        >
          मानचित्र →
        </button>
      </div>
    );
  }

  if (screen === 'restoration') {
    const stage = local.sublevelIndex;
    return (
      <div className="fixed inset-0 overflow-hidden">
        <motion.div
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
        >
          <img
            src={getForestStageUrl(stage)}
            alt="जंगल बहाल हो रहा है"
            className="w-full h-full object-cover"
            onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
          />
          <div className="absolute inset-0 bg-bg-twilight/40" />
        </motion.div>
        <div className="relative z-10 flex flex-col items-center justify-end h-full pb-20 px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="text-center"
          >
            <p className="text-firefly font-baloo2 text-3xl mb-2">वाह! जंगल जाग गया! ✨</p>
            <p className="text-surface/60 font-mukta text-base mb-6">
              अगला पड़ाव तैयार है
            </p>
            <button
              onClick={handleRestorationDone}
              className="bg-firefly text-ink font-baloo2 text-lg px-8 py-3 rounded-2xl active:scale-95 transition-transform"
            >
              आगे बढ़ो →
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  const sublevel = level1.sublevels[local.sublevelIndex];
  if (!sublevel) {
    router.replace('/map');
    return null;
  }
  const exercise = sublevel.exercises[local.exerciseIndex];
  if (!exercise) {
    router.replace('/map');
    return null;
  }

  return (
    <ExercisePlayer
      key={`${local.sublevelIndex}-${local.exerciseIndex}`}
      exercise={exercise}
      exerciseIndex={local.exerciseIndex}
      totalExercises={sublevel.exercises.length}
      onComplete={handleExerciseComplete}
    />
  );
}
