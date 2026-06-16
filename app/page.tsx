'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useProgress } from '@/lib/hooks/useProgress';

export default function RootPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { state, loading: progressLoading } = useProgress();

  useEffect(() => {
    if (authLoading || progressLoading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    // Guard: progress may not have loaded yet even if progressLoading is false
    if (state === null) return;

    if (!state.introSeen) {
      router.replace('/intro');
      return;
    }

    if (
      state.currentSublevelIndex !== undefined &&
      state.currentExerciseIndex !== undefined
    ) {
      router.replace('/level/level-1/play');
      return;
    }

    router.replace('/map');
  }, [authLoading, progressLoading, user, state, router]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-bg-twilight">
      <div className="w-8 h-8 rounded-full border-4 border-firefly border-t-transparent animate-spin" />
    </div>
  );
}
