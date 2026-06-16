'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useProgress } from '@/lib/hooks/useProgress';
import FireflyMotes from '@/components/effects/FireflyMotes';

function isLevel1Complete(state: { sublevels?: Array<{ status: string }> } | null): boolean {
  if (!state?.sublevels) return false;
  return state.sublevels.every(sl => sl.status === 'completed');
}

export default function MapPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { state } = useProgress();
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [loading, user, router]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  const level1Done = isLevel1Complete(state);

  if (loading || !user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-bg-twilight">
        <div className="w-8 h-8 rounded-full border-4 border-firefly border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-bg-twilight overflow-hidden">
      <FireflyMotes count={10} />

      <div className="relative w-full h-full flex items-center justify-center">
        <div className="relative w-full max-w-md aspect-square">
          {/* Map image placeholder */}
          <div className="absolute inset-0 rounded-2xl bg-bg-forest-dark border border-forest/30">
            <img
              src="/assets/bg/map_aksharvan.webp"
              alt="Aksharvan Map"
              className="w-full h-full object-cover rounded-2xl"
              onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
            />
          </div>

          {/* Jadooi Jungle hotspot */}
          <button
            onClick={() => router.push('/level/level-1')}
            className="absolute top-1/3 left-1/4 w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1 transition-transform active:scale-95"
            style={{
              background: level1Done
                ? 'radial-gradient(circle, var(--success) 0%, var(--forest) 100%)'
                : 'radial-gradient(circle, var(--forest) 0%, var(--forest-deep) 100%)',
              boxShadow: level1Done
                ? '0 0 20px var(--success)'
                : '0 0 12px var(--forest)',
            }}
          >
            <span className="text-2xl" aria-hidden="true">{level1Done ? '🌳' : '🌲'}</span>
            <span className="text-white font-mukta text-xs leading-tight text-center px-1">
              जादूई जंगल
            </span>
            {level1Done && (
              <span className="text-xs text-firefly font-mukta">✓ पूर्ण</span>
            )}
          </button>

          {/* Locked region 1 */}
          <button
            onClick={() => showToast('जल्द आ रहा है!')}
            className="absolute top-1/3 right-1/4 w-20 h-20 rounded-full flex flex-col items-center justify-center gap-1 bg-ink/40 border border-surface/20"
          >
            <span className="text-xl opacity-50" aria-hidden="true">🌊</span>
            <span className="text-surface/40 font-mukta text-xs text-center px-1">इंद्रधनुष</span>
            <span className="text-surface/30 text-xs">🔒</span>
          </button>

          {/* Locked region 2 */}
          <button
            onClick={() => showToast('जल्द आ रहा है!')}
            className="absolute bottom-1/3 left-1/3 w-20 h-20 rounded-full flex flex-col items-center justify-center gap-1 bg-ink/40 border border-surface/20"
          >
            <span className="text-xl opacity-50" aria-hidden="true">⛰️</span>
            <span className="text-surface/40 font-mukta text-xs text-center px-1">पर्वत</span>
            <span className="text-surface/30 text-xs">🔒</span>
          </button>
        </div>
      </div>

      <button
        onClick={() => router.push('/menu')}
        className="absolute top-4 left-4 text-surface/60 font-mukta text-sm py-2 px-3 rounded-lg bg-ink/30"
      >
        ← मेनू
      </button>

      {toast && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-surface text-ink font-mukta text-sm px-6 py-3 rounded-xl shadow-lg z-50">
          {toast}
        </div>
      )}
    </div>
  );
}
