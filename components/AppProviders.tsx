'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import { MotionConfig } from 'framer-motion';
import { AuthContext, AuthContextValue, AuthUser } from '@/lib/hooks/useAuth';
import { ProfileContext, ProfileContextValue } from '@/lib/hooks/useProfile';
import { ProgressContext, ProgressContextValue } from '@/lib/hooks/useProgress';
import type { Profile } from '@/lib/appwrite/types';
import type { ExtendedProgressState } from '@/lib/appwrite/services/progress';
import * as authService from '@/lib/appwrite/services/auth';
import * as profileService from '@/lib/appwrite/services/profile';
import * as progressService from '@/lib/appwrite/services/progress';
import { useAuth } from '@/lib/hooks/useAuth';

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    authService.getCurrentUser().then((u) => {
      setUser(u);
      setLoading(false);
    });
  }, []);

  const sendOTP = useCallback(async (phone: string) => {
    return authService.sendOTP(phone);
  }, []);

  const verifyOTP = useCallback(async (userId: string, otp: string) => {
    await authService.verifyOTP(userId, otp);
    const u = await authService.getCurrentUser();
    setUser(u);
  }, []);

  const loginWithPin = useCallback(async (phone: string, pin: string) => {
    await authService.loginWithPin(phone, pin);
    const u = await authService.getCurrentUser();
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value: AuthContextValue = { user, loading, sendOTP, verifyOTP, loginWithPin, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function ProfileProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Partial<Profile> | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProfile = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const p = await profileService.getProfile(userId);
      setProfile(p);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchProfile(user.$id);
    } else {
      setProfile(null);
    }
  }, [user, fetchProfile]);

  const updateProfile = useCallback(
    async (data: Partial<Profile>) => {
      if (!user) return;
      const updated = await profileService.updateProfile(user.$id, data);
      setProfile(updated);
    },
    [user],
  );

  const refresh = useCallback(async () => {
    if (user) await fetchProfile(user.$id);
  }, [user, fetchProfile]);

  const value: ProfileContextValue = { profile, loading, updateProfile, refresh };

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

function ProgressProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<ExtendedProgressState | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchProgress = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const s = await progressService.getProgress(userId, 'level-1');
      setState(s);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchProgress(user.$id);
    } else {
      setState(null);
    }
  }, [user, fetchProgress]);

  const saveProgress = useCallback(
    async (s: ExtendedProgressState) => {
      if (!user) return;
      await progressService.saveProgress(user.$id, 'level-1', s);
      setState(s);
    },
    [user],
  );

  const refresh = useCallback(async () => {
    if (user) await fetchProgress(user.$id);
  }, [user, fetchProgress]);

  const value: ProgressContextValue = { state, loading, saveProgress, refresh };

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>;
}

export default function AppProviders({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      <AuthProvider>
        <ProfileProvider>
          <ProgressProvider>{children}</ProgressProvider>
        </ProfileProvider>
      </AuthProvider>
    </MotionConfig>
  );
}
