'use client';

import { createContext, useContext } from 'react';
import type { Profile } from '../appwrite/types';

export interface ProfileContextValue {
  profile: Partial<Profile> | null;
  loading: boolean;
  updateProfile(data: Partial<Profile>): Promise<void>;
  refresh(): Promise<void>;
}

export const ProfileContext = createContext<ProfileContextValue | null>(null);

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within ProfileProvider');
  return ctx;
}
