'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useProgress } from '@/lib/hooks/useProgress';
import FireflyMotes from '@/components/effects/FireflyMotes';
import PuppetGuide from '@/components/characters/PuppetGuide';
import Button from '@/components/ui/Button';

function useSmartResumeTarget(): string | null {
  const { state } = useProgress();
  if (!state) return null;
  if (!state.introSeen) return '/intro';
  if (state.currentSublevelIndex !== undefined && state.currentExerciseIndex !== undefined) {
    return '/level/level-1/play';
  }
  return '/map';
}

export default function MenuPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const resumeTarget = useSmartResumeTarget();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  const handlePlay = () => {
    if (resumeTarget) router.push(resumeTarget);
  };

  if (loading || !user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-bg-twilight">
        <div className="w-8 h-8 rounded-full border-4 border-firefly border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-between bg-bg-twilight overflow-hidden">
      {/* Ambient fireflies */}
      <FireflyMotes count={16} />

      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-bg-twilight/80 via-transparent to-bg-twilight/90 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-between h-full w-full max-w-sm mx-auto px-6 py-12">
        {/* Title */}
        <div className="text-center mt-4">
          <h1 className="text-4xl font-baloo2 text-surface mb-1">अक्षरवन</h1>
          <p className="text-surface/50 font-mukta text-sm">जादूई जंगल की कहानी</p>
        </div>

        {/* Characters */}
        <div className="flex items-end gap-12 justify-center w-full">
          <PuppetGuide character="tina" size={100} />
          <PuppetGuide character="toto" size={100} />
        </div>

        {/* Action buttons */}
        <div className="w-full space-y-3">
          <Button
            onClick={handlePlay}
            disabled={resumeTarget === null}
            size="lg"
            className="text-xl font-baloo2 bg-firefly text-ink hover:bg-firefly-glow border-0"
          >
            खेलें ✨
          </Button>
          <Button
            onClick={() => router.push('/settings')}
            variant="ghost"
            size="md"
            className="text-surface/70 hover:text-surface"
          >
            सेटिंग्स
          </Button>
        </div>
      </div>
    </div>
  );
}
