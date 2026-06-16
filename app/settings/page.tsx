'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/useAuth';
import { useProfile } from '@/lib/hooks/useProfile';
import * as pinService from '@/lib/appwrite/services/pin';
import Button from '@/components/ui/Button';

function toAvatarVariant(age: number): 0 | 1 | 2 {
  if (age <= 5) return 0;
  if (age <= 7) return 1;
  return 2;
}

export default function SettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { profile, loading: profileLoading, updateProfile } = useProfile();

  const [age, setAge] = useState(6);
  const [pin, setPin] = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [showPinForm, setShowPinForm] = useState(false);
  const [pinBusy, setPinBusy] = useState(false);
  const [ageBusy, setAgeBusy] = useState(false);
  const [pinMessage, setPinMessage] = useState('');
  const [ageMessage, setAgeMessage] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login');
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    if (profile?.child_age) {
      setAge(profile.child_age as number);
    }
  }, [profile]);

  const handleSaveAge = async () => {
    if (!user) return;
    setAgeBusy(true);
    setAgeMessage('');
    try {
      await updateProfile({ child_age: age, avatar_variant: toAvatarVariant(age) });
      setAgeMessage('उम्र सेव हो गई ✓');
    } catch {
      setAgeMessage('सेव करने में समस्या हुई');
    } finally {
      setAgeBusy(false);
    }
  };

  const handleSetPin = async () => {
    if (pin.length !== 4 || pin !== pinConfirm) {
      setPinMessage('PIN 4 अंकी होनी चाहिए और दोनों एक जैसी होनी चाहिए');
      return;
    }
    setPinBusy(true);
    setPinMessage('');
    try {
      await pinService.setPin(pin);
      setPinMessage('PIN सेट हो गई ✓');
      setShowPinForm(false);
      setPin('');
      setPinConfirm('');
    } catch {
      setPinMessage('PIN सेट करने में समस्या हुई');
    } finally {
      setPinBusy(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  if (authLoading || profileLoading || !user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-bg-twilight">
        <div className="w-8 h-8 rounded-full border-4 border-firefly border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-y-auto bg-bg-twilight p-4">
      <div className="w-full max-w-sm mx-auto pt-8 pb-16">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.back()}
            className="text-surface/60 font-mukta text-sm py-2 pr-2"
          >
            ← वापस
          </button>
          <h1 className="text-2xl font-baloo2 text-surface">सेटिंग्स</h1>
        </div>

        {/* Age section */}
        <div className="bg-surface rounded-2xl p-5 mb-4">
          <h2 className="text-base font-mukta font-semibold text-ink mb-4">बच्चे की उम्र</h2>
          <label className="block text-xs font-mukta text-ink/60 mb-2">
            उम्र: <strong className="text-ink">{age}</strong> वर्ष
          </label>
          <input
            type="range"
            min={4}
            max={10}
            value={age}
            onChange={e => setAge(Number(e.target.value))}
            className="w-full accent-forest mb-1"
          />
          <div className="flex justify-between text-xs text-ink/40 font-mukta mb-4">
            <span>4</span>
            <span>7</span>
            <span>10</span>
          </div>
          {ageMessage && (
            <p className="text-xs font-mukta text-forest mb-3">{ageMessage}</p>
          )}
          <Button onClick={handleSaveAge} disabled={ageBusy} size="sm">
            {ageBusy ? '…' : 'सेव करें'}
          </Button>
        </div>

        {/* PIN section */}
        <div className="bg-surface rounded-2xl p-5 mb-4">
          <h2 className="text-base font-mukta font-semibold text-ink mb-4">PIN</h2>
          {!showPinForm ? (
            <Button onClick={() => setShowPinForm(true)} variant="ghost" size="sm">
              PIN सेट / बदलें
            </Button>
          ) : (
            <>
              <div className="mb-3">
                <label className="block text-xs font-mukta text-ink/60 mb-1">नई 4-अंकी PIN</label>
                <input
                  type="password"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  className="w-full border border-ink/30 rounded-xl px-4 py-3 text-ink font-mukta text-lg tracking-widest outline-none bg-transparent focus:border-forest"
                  placeholder="••••"
                  maxLength={4}
                  inputMode="numeric"
                />
              </div>
              <div className="mb-3">
                <label className="block text-xs font-mukta text-ink/60 mb-1">PIN दोबारा दर्ज करें</label>
                <input
                  type="password"
                  value={pinConfirm}
                  onChange={e => setPinConfirm(e.target.value)}
                  className="w-full border border-ink/30 rounded-xl px-4 py-3 text-ink font-mukta text-lg tracking-widest outline-none bg-transparent focus:border-forest"
                  placeholder="••••"
                  maxLength={4}
                  inputMode="numeric"
                />
              </div>
              {pinMessage && (
                <p className="text-xs font-mukta text-forest mb-3">{pinMessage}</p>
              )}
              <div className="flex gap-2">
                <Button onClick={handleSetPin} disabled={pinBusy} size="sm">
                  {pinBusy ? '…' : 'PIN सेव करें'}
                </Button>
                <button
                  onClick={() => { setShowPinForm(false); setPin(''); setPinConfirm(''); setPinMessage(''); }}
                  className="flex-1 text-ink/50 font-mukta text-sm py-2"
                >
                  रद्द
                </button>
              </div>
            </>
          )}
        </div>

        {/* Logout */}
        <div className="bg-surface rounded-2xl p-5">
          <h2 className="text-base font-mukta font-semibold text-ink mb-4">खाता</h2>
          <Button onClick={handleLogout} variant="danger" size="sm">
            लॉग आउट
          </Button>
        </div>
      </div>
    </div>
  );
}
