'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { useProgress } from '@/lib/hooks/useProgress';
import FireflyMotes from '@/components/effects/FireflyMotes';
import { getForestStageUrl } from '@/lib/appwrite/services/assets';

interface CompletePageClientProps {
  levelId: string;
}

export default function CompletePageClient({ levelId: _levelId }: CompletePageClientProps) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { state } = useProgress();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) return null;

  const isComplete = state?.sublevels?.every(sl => sl.status === 'completed') ?? false;

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Fully restored forest background */}
      <div className="absolute inset-0">
        <img
          src={getForestStageUrl(6)}
          alt="हरा-भरा जादूई जंगल"
          className="w-full h-full object-cover"
          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
        />
        <div className="absolute inset-0 bg-bg-twilight/30" />
      </div>

      <FireflyMotes count={20} />

      <div className="relative z-10 flex flex-col items-center justify-center h-full px-6 text-center gap-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.8, type: 'spring', bounce: 0.4 }}
        >
          <p className="text-firefly font-baloo2 text-5xl mb-3">याय! 🌟</p>
          <p className="text-surface font-mukta text-xl leading-relaxed mb-2">
            हमने कर दिखाया!
          </p>
          <p className="text-surface/80 font-mukta text-base leading-relaxed">
            अक्षरवन वापस हरा-भरा हो गया!
          </p>
        </motion.div>

        {isComplete && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-col gap-2 items-center"
          >
            <div className="flex gap-1">
              {'⭐⭐⭐'.split('').map((s, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.8 + i * 0.15, type: 'spring', bounce: 0.6 }}
                  className="text-4xl"
                >
                  {s}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          onClick={() => router.replace('/map')}
          className="bg-firefly text-ink font-baloo2 text-xl px-10 py-4 rounded-2xl active:scale-95 transition-transform shadow-lg"
        >
          मानचित्र देखो →
        </motion.button>
      </div>
    </div>
  );
}
