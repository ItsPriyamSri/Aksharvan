'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useAppwriteStatus } from '@/lib/hooks/useAppwriteStatus';
import * as profileService from '@/lib/appwrite/services/profile';
import * as progressService from '@/lib/appwrite/services/progress';
import Button from '@/components/ui/Button';

type Tab = 'otp' | 'pin';
type Step = 'form' | 'otp';

function toAvatarVariant(age: number): 0 | 1 | 2 {
  if (age <= 5) return 0;
  if (age <= 7) return 1;
  return 2;
}

function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('91') && digits.length === 12) return '+' + digits;
  if (digits.length === 10) return '+91' + digits;
  return '+' + digits;
}

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, sendOTP, verifyOTP, loginWithPin } = useAuth();
  const { isConfigured } = useAppwriteStatus();

  const [tab, setTab] = useState<Tab>('otp');
  const [step, setStep] = useState<Step>('form');
  const [phone, setPhone] = useState('');
  const [age, setAge] = useState(6);
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [userId, setUserId] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const phoneRef = useRef('');
  const ageRef = useRef(6);
  const setupStarted = useRef(false);

  useEffect(() => {
    if (loading || !user) return;
    if (setupStarted.current) return;
    setupStarted.current = true;

    const setup = async () => {
      try {
        const existing = await profileService.getProfile(user.$id);
        if (!existing) {
          await profileService.createProfile(user.$id, {
            parentPhone: phoneRef.current || user.phone || '',
            childAge: ageRef.current,
            avatarVariant: toAvatarVariant(ageRef.current),
          });
        }
        await progressService.createProgress(user.$id, 'level-1');
      } catch {
        // Profile or progress may already exist — safe to ignore
      }
      router.replace('/menu');
    };

    setup();
  }, [loading, user, router]);

  const handleSendOTP = async () => {
    const normalised = normalisePhone(phone);
    if (normalised.length < 10) {
      setError('सही फ़ोन नंबर दर्ज करें');
      return;
    }
    phoneRef.current = normalised;
    ageRef.current = age;
    setBusy(true);
    setError('');
    try {
      const { userId: uid } = await sendOTP(normalised);
      setUserId(uid);
      setStep('otp');
    } catch {
      setError('OTP भेजने में समस्या हुई। पुनः प्रयास करें।');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      setError('OTP दर्ज करें');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await verifyOTP(userId, otp.trim());
      // Auth context updates user → useEffect handles redirect
    } catch {
      setError('OTP गलत है। पुनः प्रयास करें।');
      setBusy(false);
    }
  };

  const handlePINLogin = async () => {
    const normalised = normalisePhone(phone);
    if (normalised.length < 10 || !pin.trim()) {
      setError('फ़ोन और PIN दर्ज करें');
      return;
    }
    phoneRef.current = normalised;
    ageRef.current = age;
    setBusy(true);
    setError('');
    try {
      await loginWithPin(normalised, pin.trim());
      // Auth context updates user → useEffect handles redirect
    } catch {
      setError('PIN गलत है। पुनः प्रयास करें।');
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-bg-twilight">
        <div className="w-8 h-8 rounded-full border-4 border-firefly border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-bg-twilight p-4">
      <div className="w-full max-w-sm bg-surface rounded-2xl p-6 shadow-2xl">
        <h1 className="text-3xl font-baloo2 text-ink text-center mb-1">अक्षरवन</h1>
        <p className="text-sm text-ink/60 text-center mb-5 font-mukta">हिंदी ध्वनि-बोध</p>

        <div className="flex justify-center mb-5">
          <span className="bg-forest/20 text-forest text-sm font-mukta px-3 py-1 rounded-full">
            हिंदी 🔒
          </span>
        </div>

        {/* Tab switcher — only in form step */}
        {step === 'form' && (
          <div className="flex border border-ink/20 rounded-xl mb-5 overflow-hidden">
            <button
              className={`flex-1 py-3 text-sm font-mukta transition-colors ${tab === 'otp' ? 'bg-forest text-white' : 'bg-transparent text-ink/70'}`}
              onClick={() => setTab('otp')}
            >
              फ़ोन + OTP
            </button>
            <button
              className={`flex-1 py-3 text-sm font-mukta transition-colors ${tab === 'pin' ? 'bg-forest text-white' : 'bg-transparent text-ink/70'}`}
              onClick={() => setTab('pin')}
            >
              PIN से लॉगिन
            </button>
          </div>
        )}

        {/* Phone input */}
        <div className="mb-4">
          <label className="block text-xs font-mukta text-ink/60 mb-1">फ़ोन नंबर</label>
          <div className="flex items-center border border-ink/30 rounded-xl overflow-hidden focus-within:border-forest">
            <span className="bg-ink/5 px-3 py-3.5 text-sm font-mukta text-ink/50 select-none">+91</span>
            <input
              type="tel"
              value={phone}
              onChange={e => setPhone(e.target.value)}
              className="flex-1 bg-transparent px-3 py-3.5 text-ink font-mukta outline-none text-base"
              placeholder="10 अंक"
              maxLength={10}
              disabled={step === 'otp' || busy}
            />
          </div>
        </div>

        {/* Age slider — shown on form step */}
        {step === 'form' && (
          <div className="mb-5">
            <label className="block text-xs font-mukta text-ink/60 mb-2">
              बच्चे की उम्र: <strong className="text-ink">{age}</strong> वर्ष
            </label>
            <input
              type="range"
              min={4}
              max={10}
              value={age}
              onChange={e => setAge(Number(e.target.value))}
              className="w-full accent-forest"
            />
            <div className="flex justify-between text-xs text-ink/40 font-mukta mt-1">
              <span>4</span>
              <span>7</span>
              <span>10</span>
            </div>
          </div>
        )}

        {/* PIN field — pin tab, form step */}
        {step === 'form' && tab === 'pin' && (
          <div className="mb-4">
            <label className="block text-xs font-mukta text-ink/60 mb-1">4-अंकी PIN</label>
            <input
              type="password"
              value={pin}
              onChange={e => setPin(e.target.value)}
              className="w-full border border-ink/30 rounded-xl px-4 py-3.5 text-ink font-mukta text-lg tracking-widest outline-none bg-transparent focus:border-forest"
              placeholder="••••"
              maxLength={4}
              disabled={busy}
            />
            {!isConfigured && (
              <p className="text-xs text-ink/40 font-mukta mt-1">Dev mode: PIN 1234 दर्ज करें</p>
            )}
          </div>
        )}

        {/* OTP input — otp step */}
        {step === 'otp' && (
          <div className="mb-4">
            <label className="block text-xs font-mukta text-ink/60 mb-1">OTP</label>
            <input
              type="text"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              className="w-full border border-ink/30 rounded-xl px-4 py-3.5 text-ink font-mukta text-2xl tracking-widest outline-none bg-transparent focus:border-forest text-center"
              placeholder="000000"
              maxLength={6}
              autoFocus
              disabled={busy}
              inputMode="numeric"
            />
            <p className="text-xs text-ink/40 font-mukta mt-2 text-center">
              {isConfigured
                ? `OTP +91${phone} पर भेजा गया`
                : 'Dev mode: OTP 000000 दर्ज करें'}
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-red-500 text-xs font-mukta mb-4 text-center">{error}</p>
        )}

        {/* Primary action */}
        <Button
          onClick={
            step === 'otp'
              ? handleVerifyOTP
              : tab === 'otp'
                ? handleSendOTP
                : handlePINLogin
          }
          disabled={busy}
        >
          {busy
            ? '…'
            : step === 'otp'
              ? 'प्रवेश करें ✓'
              : tab === 'otp'
                ? 'OTP भेजें →'
                : 'प्रवेश करें →'}
        </Button>

        {/* Back in OTP step */}
        {step === 'otp' && (
          <button
            onClick={() => {
              setStep('form');
              setOtp('');
              setError('');
            }}
            className="w-full text-center text-sm font-mukta text-ink/50 mt-3 py-2"
          >
            ← वापस जाएँ
          </button>
        )}
      </div>
    </div>
  );
}
