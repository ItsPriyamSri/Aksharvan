'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { useProgress } from '@/lib/hooks/useProgress';
import { useNarration } from '@/lib/hooks/useNarration';
import PuppetGuide from '@/components/characters/PuppetGuide';
import { getForestStageUrl } from '@/lib/appwrite/services/assets';

interface LevelPageClientProps {
  levelId: string;
}

const NARRATION_SEQUENCE = [
  { audioName: 'cutscene_jungle_01', speaker: 'toto' as const },
  { audioName: 'cutscene_jungle_02', speaker: 'tina' as const },
  { audioName: 'cutscene_jungle_03b', speaker: 'toto' as const },
];

export default function LevelPageClient({ levelId }: LevelPageClientProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { state, saveProgress } = useProgress();
  const [lineIdx, setLineIdx] = useState(0);
  const [ready, setReady] = useState(false);
  const playedRef = useRef(-1);
  const playFnRef = useRef<((onEnd?: () => void) => void) | null>(null);

  const currentLine = NARRATION_SEQUENCE[Math.min(lineIdx, NARRATION_SEQUENCE.length - 1)];
  const narration = useNarration(currentLine.audioName, currentLine.speaker);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  // Keep play ref up to date
  useEffect(() => {
    playFnRef.current = narration.play;
  }, [narration.play]);

  // Mark intro seen so level zoom isn't replayed on exact resume
  useEffect(() => {
    if (state && !state.levelIntroSeen) {
      saveProgress({ ...state, levelIntroSeen: true });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Short delay then start narration sequence
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 800);
    return () => clearTimeout(t);
  }, []);

  // Advance narration sequence
  useEffect(() => {
    if (!ready) return;
    if (playedRef.current === lineIdx) return;
    playedRef.current = lineIdx;

    const t = setTimeout(() => {
      playFnRef.current?.(() => {
        const next = lineIdx + 1;
        if (next >= NARRATION_SEQUENCE.length) {
          router.push(`/level/${levelId}/play`);
        } else {
          setLineIdx(next);
        }
      });
    }, 200);
    return () => clearTimeout(t);
  }, [ready, lineIdx, levelId, router]);

  const handleSkip = () => {
    router.push(`/level/${levelId}/play`);
  };

  if (loading || !user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-bg-twilight">
        <div className="w-8 h-8 rounded-full border-4 border-firefly border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-bg-forest-dark">
      {/* Ken Burns grey forest background */}
      <motion.div
        className="absolute inset-0"
        animate={{ scale: [1, 1.08] }}
        transition={{ duration: 8, ease: 'linear' }}
      >
        <img
          src={getForestStageUrl(0)}
          alt="जादूई जंगल"
          className="w-full h-full object-cover opacity-70"
          onError={e => { (e.currentTarget as HTMLImageElement).style.opacity = '0'; }}
        />
        <div className="absolute inset-0 bg-bg-forest-dark/60" />
      </motion.div>

      {/* Content layer */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Skip button */}
        <div className="flex justify-end p-4">
          <button
            onClick={handleSkip}
            className="bg-black/40 text-white/70 font-mukta text-sm px-4 py-2 rounded-full"
          >
            छोड़ें →
          </button>
        </div>

        {/* Title */}
        <motion.div
          className="text-center px-6 mt-4"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <h1 className="text-3xl font-baloo2 text-firefly">जादूई जंगल</h1>
          <p className="text-surface/60 font-mukta text-sm mt-1">Jadooi Jungle</p>
        </motion.div>

        {/* Subtitle */}
        <div className="flex-1 flex items-center justify-center px-8">
          {narration.subtitle && (
            <motion.div
              key={narration.subtitle}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/60 rounded-2xl px-6 py-4 text-center max-w-xs"
            >
              <p className="text-surface font-mukta text-lg leading-relaxed">
                {narration.subtitle}
              </p>
            </motion.div>
          )}
        </div>

        {/* Puppet guides */}
        <motion.div
          className="flex justify-around items-end px-8 pb-12"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <PuppetGuide
            character="tina"
            speaking={narration.isPlaying && currentLine.speaker === 'tina'}
            size={90}
          />
          <PuppetGuide
            character="toto"
            speaking={narration.isPlaying && currentLine.speaker === 'toto'}
            size={90}
          />
        </motion.div>
      </div>
    </div>
  );
}
