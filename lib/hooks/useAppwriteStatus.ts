'use client';

import { useState, useEffect } from 'react';
import { isAppwriteConfigured } from '../appwrite/config';

export function useAppwriteStatus(): { isConfigured: boolean; isOnline: boolean } {
  const configured = isAppwriteConfigured();
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  );

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return { isConfigured: configured, isOnline };
}
