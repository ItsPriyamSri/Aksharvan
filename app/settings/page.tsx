"use client";

// Settings — change child age, update/create PIN, logout.
// Spec §7: "change age/language" — language is locked to Hindi.
// Requires auth; redirects to /login if not authenticated.

import React, { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

import { useAuth }       from "@/contexts/AuthContext";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { updateProfile } from "@/lib/appwrite/profile";
import { setPin as appwriteSetPin } from "@/lib/appwrite/functions";
import { avatarVariantFromAge }     from "@/types/progress";

import AgeSlider         from "@/components/ui/AgeSlider";
import PinInput          from "@/components/ui/PinInput";
import FireflyBackground from "@/components/ui/FireflyBackground";
import LoadingScreen     from "@/components/ui/LoadingScreen";

const IS_MOCK =
  !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID === "your_project_id";

async function mockDelay(ms = 700) {
  return new Promise((r) => setTimeout(r, ms));
}

// ─── Section card ─────────────────────────────────────────────────────────────

function SectionCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="card p-5 flex flex-col gap-4">
      <div className="flex items-center gap-2 pb-1 border-b border-ink/10">
        <span className="text-[var(--forest)]">{icon}</span>
        <h2 className="font-display text-ink text-lg font-bold">{title}</h2>
      </div>
      {children}
    </div>
  );
}

// ─── Toast notification ───────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 24 }}
      className={[
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        "px-5 py-3 rounded-2xl font-body text-sm font-medium",
        "shadow-card max-w-xs text-center",
        type === "success"
          ? "bg-[var(--success)] text-white"
          : "bg-[var(--tina)] text-white",
      ].join(" ")}
    >
      {message}
    </motion.div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, profile, logout, setProfile, refresh } = useAuth();
  const router = useRouter();
  const { isChecking } = useRouteGuard({ mode: "require-auth" });

  // Age section
  const [age,       setAge]       = useState(profile?.child_age ?? 7);
  const [ageSaving, setAgeSaving] = useState(false);

  // PIN section
  const [pin,         setPin]        = useState("");
  const [confirmPin,  setConfirmPin] = useState("");
  const [pinSaving,   setPinSaving]  = useState(false);
  const [pinErr,      setPinErr]     = useState("");

  // Toast
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Logout confirm
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const showToast = useCallback(
    (msg: string, type: "success" | "error" = "success") => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
    },
    []
  );

  // ── Save age ───────────────────────────────────────────────────────────────

  const handleSaveAge = useCallback(async () => {
    if (!user) return;
    setAgeSaving(true);
    try {
      if (IS_MOCK) {
        await mockDelay();
        if (profile) {
          setProfile({ ...profile, child_age: age, avatar_variant: avatarVariantFromAge(age) });
        }
      } else {
        const updated = await updateProfile(user.$id, {
          childAge:      age,
          avatarVariant: avatarVariantFromAge(age),
        });
        setProfile(updated);
      }
      showToast("उम्र अपडेट हो गई ✓");
    } catch {
      showToast("उम्र अपडेट नहीं हुई", "error");
    } finally {
      setAgeSaving(false);
    }
  }, [user, age, profile, setProfile, showToast]);

  // ── Save PIN ───────────────────────────────────────────────────────────────

  const handleSavePin = useCallback(async () => {
    if (pin.length !== 4) { setPinErr("4-अंक PIN ज़रूरी है"); return; }
    if (pin !== confirmPin) { setPinErr("PIN मेल नहीं खाते"); return; }
    setPinErr("");
    setPinSaving(true);
    try {
      if (IS_MOCK) {
        await mockDelay();
      } else {
        await appwriteSetPin(pin);
      }
      setPin("");
      setConfirmPin("");
      showToast("PIN सेट हो गया ✓");
    } catch {
      showToast("PIN सेट नहीं हुआ", "error");
    } finally {
      setPinSaving(false);
    }
  }, [pin, confirmPin, showToast]);

  // ── Logout ─────────────────────────────────────────────────────────────────

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await logout();
      router.replace("/login");
    } catch {
      setLoggingOut(false);
      showToast("लॉग-आउट नहीं हुआ", "error");
    }
  }, [logout, router, showToast]);

  // ── Guard ──────────────────────────────────────────────────────────────────

  if (isChecking) return <LoadingScreen />;

  const currentAge = profile?.child_age ?? age;
  const hasPin     = !!profile?.pin_hash;

  return (
    <div className="relative min-h-dvh flex flex-col screen-safe" style={{ background:"var(--deep-blue)" }}>
      <FireflyBackground count={8} />

      {/* Header */}
      <header className="relative z-10 flex items-center gap-3 px-5 pt-6 pb-4">
        <button
          type="button"
          onClick={() => router.back()}
          className="w-10 h-10 rounded-full bg-surface/10 flex items-center justify-center
                     hover:bg-surface/20 transition-colors min-h-0"
          aria-label="वापस"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5" className="text-surface">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>
        <h1 className="font-display text-surface text-2xl font-bold">सेटिंग्स</h1>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 px-5 pb-8 flex flex-col gap-4">

        {/* Age section */}
        <SectionCard
          title="बच्चे की उम्र"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
            </svg>
          }
        >
          <AgeSlider value={age} onChange={setAge} disabled={ageSaving} />
          <button
            type="button"
            onClick={handleSaveAge}
            disabled={ageSaving || age === currentAge}
            className={[
              "btn-primary w-full",
              ageSaving || age === currentAge ? "opacity-50 cursor-not-allowed" : "",
            ].join(" ")}
          >
            {ageSaving ? "सहेज रहे हैं…" : "उम्र सहेजें"}
          </button>
        </SectionCard>

        {/* Language pill */}
        <SectionCard
          title="भाषा"
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          }
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 px-3 py-2 rounded-full bg-[var(--forest)]/15 border border-[var(--forest)]/30">
              <span>🇮🇳</span>
              <span className="font-body text-[var(--forest-deep)] font-semibold">हिंदी</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface/10">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                className="text-surface/40">
                <rect x="3" y="11" width="18" height="11" rx="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              <span className="font-body text-surface/40 text-xs">बंद</span>
            </div>
          </div>
          <p className="font-body text-ink/50 text-xs">
            फ़िलहाल केवल हिंदी उपलब्ध है
          </p>
        </SectionCard>

        {/* PIN section */}
        <SectionCard
          title={hasPin ? "PIN बदलें" : "PIN सेट करें"}
          icon={
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          }
        >
          {hasPin && (
            <div className="rounded-xl bg-[var(--success)]/10 border border-[var(--success)]/20 px-4 py-2">
              <p className="font-body text-[var(--success)] text-sm flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                PIN सेट है — नया PIN बनाने के लिए नीचे डालें
              </p>
            </div>
          )}
          <PinInput
            mode="setup"
            pin={pin}
            confirmPin={confirmPin}
            onPinChange={(v) => { setPin(v); setPinErr(""); }}
            onConfirmChange={(v) => { setConfirmPin(v); setPinErr(""); }}
            error={pinErr}
            disabled={pinSaving}
          />
          <button
            type="button"
            onClick={handleSavePin}
            disabled={pinSaving || pin.length < 4 || confirmPin.length < 4}
            className={[
              "btn-primary w-full",
              pinSaving || pin.length < 4 || confirmPin.length < 4
                ? "opacity-50 cursor-not-allowed"
                : "",
            ].join(" ")}
          >
            {pinSaving ? "PIN सेट हो रहा है…" : "PIN सहेजें"}
          </button>
        </SectionCard>

        {/* Account info */}
        {profile && (
          <SectionCard
            title="खाता जानकारी"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4" />
                <path d="M20 21a8 8 0 1 0-16 0" />
              </svg>
            }
          >
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center py-1">
                <span className="font-body text-ink/60 text-sm">फ़ोन</span>
                <span className="font-body text-ink font-medium text-sm">
                  {profile.parent_phone}
                </span>
              </div>
              <div className="h-px bg-ink/8" />
              <div className="flex justify-between items-center py-1">
                <span className="font-body text-ink/60 text-sm">बच्चे की उम्र</span>
                <span className="font-body text-ink font-medium text-sm">
                  {profile.child_age} साल
                </span>
              </div>
              <div className="h-px bg-ink/8" />
              <div className="flex justify-between items-center py-1">
                <span className="font-body text-ink/60 text-sm">खाता बना</span>
                <span className="font-body text-ink/60 text-sm">
                  {new Date(profile.created_at).toLocaleDateString("hi-IN")}
                </span>
              </div>
            </div>
          </SectionCard>
        )}

        {/* Logout */}
        <div className="mt-2">
          {!showLogoutConfirm ? (
            <button
              type="button"
              onClick={() => setShowLogoutConfirm(true)}
              className="w-full py-3.5 rounded-2xl border-2 border-[var(--tina)]/40 text-[var(--tina)]
                         font-body font-semibold text-base hover:bg-[var(--tina)]/10 transition-colors
                         flex items-center justify-center gap-2 min-h-[56px]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              लॉग-आउट करें
            </button>
          ) : (
            <AnimatePresence>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="card p-5 flex flex-col gap-4"
              >
                <p className="font-body text-ink text-center font-medium">
                  क्या आप वाकई लॉग-आउट करना चाहते हैं?
                </p>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowLogoutConfirm(false)}
                    disabled={loggingOut}
                    className="flex-1 btn-secondary text-ink border-ink/20 min-h-[48px]"
                  >
                    रद्द करें
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    className="flex-1 min-h-[48px] rounded-full bg-[var(--tina)] text-white
                               font-body font-bold text-base flex items-center justify-center"
                  >
                    {loggingOut ? "लॉग-आउट…" : "हाँ, लॉग-आउट"}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Mock badge */}
        {IS_MOCK && (
          <div className="rounded-xl bg-[var(--magic)]/20 border border-[var(--magic)]/30 px-4 py-2">
            <p className="font-body text-[var(--magic)] text-xs text-center">
              🔧 Mock मोड — Appwrite से कनेक्ट नहीं
            </p>
          </div>
        )}
      </main>

      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast message={toast.msg} type={toast.type} />}
      </AnimatePresence>
    </div>
  );
}
