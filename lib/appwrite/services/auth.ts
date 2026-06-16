import { ID, AppwriteException } from 'appwrite';
import { account, appwriteFunctions } from '../client';
import { isAppwriteConfigured } from '../config';
import { FUNCTION_LOGIN_WITH_PIN } from '../constants';
import type { LoginWithPinResponse } from '../types';

const MOCK_SESSION_KEY = 'aksharvan:mock-session';

interface MockSession {
  userId: string;
  phone: string;
}

export async function sendOTP(phone: string): Promise<{ userId: string }> {
  if (isAppwriteConfigured()) {
    const token = await account.createPhoneToken(ID.unique(), phone);
    return { userId: token.userId };
  }
  return { userId: 'mock_' + phone };
}

export async function verifyOTP(userId: string, otp: string): Promise<void> {
  if (isAppwriteConfigured()) {
    await account.createSession(userId, otp);
    return;
  }
  const session: MockSession = { userId, phone: '' };
  localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
}

export async function loginWithPin(phone: string, pin: string): Promise<void> {
  if (isAppwriteConfigured()) {
    const execution = await appwriteFunctions.createExecution(
      FUNCTION_LOGIN_WITH_PIN,
      JSON.stringify({ phone, pin }),
    );
    const response: LoginWithPinResponse = JSON.parse(execution.responseBody);
    await account.createSession(response.userId, response.secret);
    return;
  }
  if (pin !== '1234') {
    throw new Error('Invalid PIN');
  }
  const session: MockSession = { userId: 'mock_' + phone, phone };
  localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(session));
}

export async function getCurrentUser(): Promise<{ $id: string; phone: string } | null> {
  if (isAppwriteConfigured()) {
    try {
      const user = await account.get();
      return { $id: user.$id, phone: user.phone };
    } catch (e) {
      if (e instanceof AppwriteException && e.code === 401) return null;
      return null;
    }
  }
  const raw = localStorage.getItem(MOCK_SESSION_KEY);
  if (!raw) return null;
  const session: MockSession = JSON.parse(raw);
  return { $id: session.userId, phone: session.phone };
}

export async function logout(): Promise<void> {
  if (isAppwriteConfigured()) {
    await account.deleteSession('current');
    return;
  }
  localStorage.removeItem(MOCK_SESSION_KEY);
}
