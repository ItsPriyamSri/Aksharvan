'use client';

import { createContext, useContext } from 'react';
import type { ExtendedProgressState } from '../appwrite/services/progress';

export interface ProgressContextValue {
  state: ExtendedProgressState | null;
  loading: boolean;
  saveProgress(s: ExtendedProgressState): Promise<void>;
  refresh(): Promise<void>;
}

export const ProgressContext = createContext<ProgressContextValue | null>(null);

export function useProgress(): ProgressContextValue {
  const ctx = useContext(ProgressContext);
  if (!ctx) throw new Error('useProgress must be used within ProgressProvider');
  return ctx;
}
