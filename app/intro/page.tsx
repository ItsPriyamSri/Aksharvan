'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useProgress } from '@/lib/hooks/useProgress';

export default function IntroPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { state, saveProgress } = useProgress();
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  const handleComplete = async () => {
    if (!state) return;
    await saveProgress({ ...state, introSeen: true });
    router.replace('/map');
  };

  if (authLoading || !user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-bg-twilight">
        <div className="w-8 h-8 rounded-full border-4 border-firefly border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black overflow-hidden">
      {/* Portrait video */}
      <video
        ref={videoRef}
        src="/assets/video/intro_portrait.mp4"
        autoPlay
        playsInline
        muted={false}
        onEnded={handleComplete}
        className="absolute inset-0 w-full h-full object-contain"
      />

      {/* Fallback when no video — centred placeholder */}
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-bg-forest-dark pointer-events-none">
        <p className="text-surface/40 font-mukta text-sm">वीडियो लोड हो रहा है…</p>
      </div>

      {/* Skip — always visible */}
      <button
        onClick={handleComplete}
        disabled={!state}
        className="absolute top-4 right-4 z-20 bg-black/50 text-white font-mukta text-sm px-4 py-2 rounded-full disabled:opacity-40"
      >
        छोड़ें →
      </button>
    </div>
  );
}
