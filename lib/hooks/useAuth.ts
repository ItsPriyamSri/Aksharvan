'use client';

import { createContext, useContext } from 'react';

export interface AuthUser {
  $id: string;
  phone: string;
}

export interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  sendOTP(phone: string): Promise<{ userId: string }>;
  verifyOTP(userId: string, otp: string): Promise<void>;
  loginWithPin(phone: string, pin: string): Promise<void>;
  logout(): Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
