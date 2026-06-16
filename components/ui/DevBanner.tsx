'use client';

import { useAppwriteStatus } from '@/lib/hooks/useAppwriteStatus';

export default function DevBanner() {
  const { isConfigured } = useAppwriteStatus();

  if (isConfigured) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-firefly text-ink text-xs px-4 py-1 text-center">
      Offline dev mode — using local fallbacks
    </div>
  );
}
