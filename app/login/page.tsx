"use client";
// LOGIN — 3 screens: Phone → PIN Setup → Age Selection
// Guest login = phone number only, no OTP in mock mode
// Persists profile to localStorage via saveMockSession

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { avatarVariantFromAge } from "@/types/progress";

type Step = "phone" | "pin" | "age";

const IS_MOCK = !process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ||
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID === "your_project_id";

// ── Forest night background elements ─────────────────────
function Star({ x, y, size, delay }: { x: number; y: number; size: number; delay: number }) {
  return (
    <motion.div className="absolute rounded-full bg-white pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size }}
      animate={{ opacity: [0.1, 0.9, 0.1] }}
      transition={{ duration: 2.5 + delay, repeat: Infinity, delay, ease: "easeInOut" }} />
  );
}

function Firefly({ x, y, size, dur, del }: { x: number; y: number; size: number; dur: number; del: number }) {
  return (
    <motion.div className="absolute rounded-full pointer-events-none"
      style={{ left: `${x}%`, top: `${y}%`, width: size, height: size,
        background: "#FFC84A", boxShadow: `0 0 ${size * 4}px rgba(255,200,74,0.7)` }}
      animate={{ y: [0, -20, 0], x: [0, 8, -5, 0], opacity: [0.2, 1, 0.2], scale: [1, 1.3, 1] }}
      transition={{ duration: dur, repeat: Infinity, delay: del, ease: "easeInOut" }} />
  );
}

// ── PIN dot display ───────────────────────────────────────
function PinDots({ value, total = 4 }: { value: string; total?: number }) {
  return (
    <div className="flex gap-4 justify-center py-2">
      {Array.from({ length: total }, (_, i) => (
        <motion.div key={i}
          animate={{ scale: i === value.length ? [1, 1.3, 1] : 1, background: i < value.length ? "#FFC84A" : "rgba(26,16,37,0.12)" }}
          transition={{ duration: 0.2 }}
          className="w-5 h-5 rounded-full"
          style={{ border: "2px solid rgba(26,16,37,0.25)" }} />
      ))}
    </div>
  );
}

// ── Number pad ────────────────────────────────────────────
function NumPad({ onPress, onDelete }: { onPress: (d: string) => void; onDelete: () => void }) {
  const keys = ["1","2","3","4","5","6","7","8","9","","0","⌫"];
  return (
    <div className="grid grid-cols-3 gap-3 w-full max-w-[280px] mx-auto">
      {keys.map((k, i) => (
        k === "" ? <div key={i} /> :
        <motion.button key={i} type="button"
          whileTap={{ scale: 0.88, background: "rgba(124,92,191,0.15)" }}
          onClick={() => k === "⌫" ? onDelete() : onPress(k)}
          className="h-14 rounded-2xl flex items-center justify-center font-display font-bold text-2xl transition-colors"
          style={{ background: "rgba(26,16,37,0.06)", border: "1.5px solid rgba(26,16,37,0.12)",
            color: k === "⌫" ? "var(--warn)" : "var(--ink)" }}>
          {k}
        </motion.button>
      ))}
    </div>
  );
}

// ── Avatar for age selection ──────────────────────────────
function AgeAvatar({ age }: { age: number }) {
  const data =
    age <= 5 ? { emoji: "🌱", label: "बिल्कुल छोटे", color: "#66BB6A" } :
    age <= 7 ? { emoji: "⭐", label: "मंझले खिलाड़ी", color: "#FFC84A" } :
               { emoji: "🌟", label: "बड़े खिलाड़ी",  color: "#9D7FD4" };
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div key={data.emoji}
        initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
        className="w-24 h-24 rounded-full flex items-center justify-center text-5xl"
        style={{ background: `${data.color}20`, border: `3px solid ${data.color}50`,
          boxShadow: `0 0 24px ${data.color}40` }}>
        {data.emoji}
      </motion.div>
      <span className="font-body text-sm font-semibold" style={{ color: data.color }}>
        {data.label}
      </span>
    </div>
  );
}

// ── MAIN ─────────────────────────────────────────────────
export default function LoginPage() {
  const { status, saveMockSession } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace("/menu");
  }, [status, router]);

  const [step,  setStep]  = useState<Step>("phone");
  const [dir,   setDir]   = useState(1);
  const [busy,  setBusy]  = useState(false);
  const [err,   setErr]   = useState("");

  // Phone step
  const [phone, setPhone] = useState("");

  // PIN step
  const [pin,     setPin]     = useState("");
  const [confirm, setConfirm] = useState("");
  const [pinStage, setPinStage] = useState<"enter" | "confirm">("enter");

  // Age step
  const [age, setAge] = useState(7);

  const go = (s: Step, d = 1) => { setErr(""); setDir(d); setStep(s); };

  // ── Step 1: phone ─────────────────────────────────────
  const handlePhone = useCallback(() => {
    if (phone.length < 10) return setErr("10 अंकों का नंबर डालें");
    if (!/^[6-9]/.test(phone)) return setErr("6-9 से शुरू होना चाहिए");
    go("pin");
  }, [phone]);

  // ── Step 2: PIN ───────────────────────────────────────
  const handlePinPress = (d: string) => {
    setErr("");
    if (pinStage === "enter") {
      const next = (pin + d).slice(0, 4);
      setPin(next);
      if (next.length === 4) setTimeout(() => setPinStage("confirm"), 300);
    } else {
      const next = (confirm + d).slice(0, 4);
      setConfirm(next);
      if (next.length === 4) {
        setTimeout(() => {
          if (next === pin) { setPinStage("enter"); go("age"); }
          else { setErr("PIN मेल नहीं खाते, फिर से कोशिश करें"); setConfirm(""); }
        }, 200);
      }
    }
  };
  const handlePinDelete = () => {
    setErr("");
    if (pinStage === "enter") setPin(p => p.slice(0, -1));
    else setConfirm(c => c.slice(0, -1));
  };
  const handlePinBack = () => {
    setPinStage("enter"); setPin(""); setConfirm(""); go("phone", -1);
  };

  // ── Step 3: age + finish ──────────────────────────────
  const handleFinish = useCallback(async () => {
    setBusy(true);
    try {
      const uid = `guest-${phone.replace(/\D/g, "")}-${Date.now()}`;
      const variant = avatarVariantFromAge(age);
      const prof = {
        $id: uid, parent_phone: `+91${phone}`, language: "hi" as const,
        child_age: age, avatar_variant: variant, created_at: new Date().toISOString(),
      };
      saveMockSession(uid, prof);
      router.replace("/menu");
    } catch { setErr("कुछ गड़बड़ हो गई"); }
    finally { setBusy(false); }
  }, [age, phone, saveMockSession, router]);

  // Stars & fireflies
  const STARS = [[5,3],[22,7],[42,4],[62,2],[78,8],[92,5],[15,16],[52,13],[82,10],[35,20],[68,17],[48,1]];
  const FLIES = [{x:8,y:15,size:4,dur:4,del:0},{x:86,y:20,size:5,dur:5,del:1.2},{x:15,y:68,size:3,dur:6,del:2},
    {x:80,y:74,size:4,dur:4.5,del:0.6},{x:46,y:9,size:3,dur:5,del:1.8},{x:91,y:52,size:5,dur:4,del:2.9},
    {x:26,y:84,size:4,dur:5.5,del:0.8},{x:68,y:38,size:3,dur:4.2,del:2.3}];

  const stepIdx = step === "phone" ? 0 : step === "pin" ? 1 : 2;

  return (
    <div className="relative min-h-dvh flex flex-col overflow-hidden screen-safe"
      style={{ background: "linear-gradient(180deg,#040912 0%,#080F1E 30%,#0D1628 65%,#0A1810 100%)" }}>

      {/* Background */}
      {STARS.map(([x,y],i) => <Star key={i} x={x} y={y} size={1.5+(i%2)} delay={i*0.38} />)}
      {FLIES.map((f,i) => <Firefly key={i} {...f} />)}
      <div className="absolute rounded-full pointer-events-none"
        style={{ right:"9%",top:"4%",width:60,height:60,
          background:"radial-gradient(circle at 35% 35%,#FFFDE7,#FFD54F)",
          boxShadow:"0 0 40px 14px rgba(255,213,79,0.2)" }} />
      <svg className="absolute bottom-0 w-full pointer-events-none" viewBox="0 0 430 150" preserveAspectRatio="none" style={{height:150}}>
        <path d="M-5 150 L25 80 L55 150Z M40 150 L78 65 L116 150Z M248 150 L285 63 L322 150Z M318 150 L352 78 L386 150Z M400 150 L422 92 L444 150Z" fill="#071510" opacity="0.95"/>
        <path d="M0 135 Q107 120 215 130 Q323 140 430 124 L430 150 L0 150Z" fill="#050F0A"/>
      </svg>

      {/* Header */}
      <div className="relative z-10 flex flex-col items-center pt-10 pb-4 px-6 gap-3">
        <motion.h1 initial={{opacity:0,y:-16}} animate={{opacity:1,y:0}} transition={{duration:0.6}}
          className="font-display font-extrabold text-center"
          style={{ fontSize:"clamp(2.2rem,9vw,2.8rem)", lineHeight:1,
            background:"linear-gradient(135deg,#FFE082,#FFC107,#FF8F00)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
          अक्षरवन
        </motion.h1>

        {/* Step progress dots */}
        <div className="flex items-center gap-2">
          {["📱","🔐","🎂"].map((icon, i) => (
            <React.Fragment key={i}>
              <motion.div animate={{ scale: i === stepIdx ? 1.15 : 0.85, opacity: i > stepIdx ? 0.35 : 1 }}
                className="flex flex-col items-center gap-0.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-base"
                  style={{ background: i < stepIdx ? "var(--success)" : i === stepIdx ? "var(--firefly)" : "rgba(255,248,237,0.1)",
                    color: i <= stepIdx ? "var(--ink)" : "rgba(255,248,237,0.4)", fontWeight:700 }}>
                  {i < stepIdx ? "✓" : icon}
                </div>
              </motion.div>
              {i < 2 && <div className="w-8 h-0.5 rounded-full" style={{ background: i < stepIdx ? "var(--success)" : "rgba(255,248,237,0.15)" }} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Form card */}
      <div className="relative z-10 flex-1 flex flex-col justify-center px-5 pb-6">
        <AnimatePresence mode="wait" custom={dir}>

          {/* ── SCREEN 1: PHONE ──────────────────────────────── */}
          {step === "phone" && (
            <Card key="phone" dir={dir}>
              <div className="text-center">
                <div className="text-5xl mb-3">📱</div>
                <h2 className="font-display font-bold text-ink" style={{fontSize:"1.55rem"}}>नमस्ते!</h2>
                <p className="font-body mt-1.5 leading-deva" style={{color:"rgba(26,16,37,0.55)",fontSize:"0.88rem"}}>
                  माता या पिता का मोबाइल नंबर डालें
                </p>
              </div>

              <div className="rounded-2xl overflow-hidden flex items-stretch"
                style={{ border:`2px solid ${err?"var(--warn)":phone.length===10?"var(--success)":"rgba(26,16,37,0.14)"}` }}>
                <div className="flex items-center gap-1.5 px-3 py-4 shrink-0 font-body font-bold"
                  style={{background:"rgba(124,92,191,0.1)",color:"var(--magic)",borderRight:"2px solid rgba(26,16,37,0.08)",fontSize:"0.88rem"}}>
                  🇮🇳 +91
                </div>
                <input type="tel" inputMode="numeric" placeholder="10 अंकों का नंबर"
                  value={phone} onChange={e => { setPhone(e.target.value.replace(/\D/g,"").slice(0,10)); setErr(""); }}
                  onKeyDown={e => e.key==="Enter" && handlePhone()}
                  className="flex-1 px-3 py-4 bg-transparent outline-none text-ink font-display font-bold"
                  style={{fontSize:"1.3rem",letterSpacing:"2px"}}
                  maxLength={10} autoComplete="tel-national"/>
                {phone.length===10 && !err && (
                  <motion.span initial={{scale:0}} animate={{scale:1}} className="flex items-center pr-3 text-lg" style={{color:"var(--success)"}}>✓</motion.span>
                )}
              </div>

              {err && <Err msg={err} />}

              <button type="button" onClick={handlePhone} disabled={phone.length < 10}
                className="btn-primary w-full text-lg" style={{fontSize:"1.1rem"}}>
                आगे बढ़ें →
              </button>

              {IS_MOCK && (
                <p className="font-body text-center" style={{fontSize:"10px",color:"rgba(26,16,37,0.38)"}}>
                  Demo: कोई भी 10 अंक डालें (जैसे 9876543210)
                </p>
              )}
            </Card>
          )}

          {/* ── SCREEN 2: PIN ────────────────────────────────── */}
          {step === "pin" && (
            <Card key="pin" dir={dir}>
              <BackBtn onClick={handlePinBack} />
              <div className="text-center">
                <div className="text-5xl mb-3">🔐</div>
                <h2 className="font-display font-bold text-ink" style={{fontSize:"1.55rem"}}>
                  {pinStage === "enter" ? "PIN बनाएं" : "PIN दोबारा डालें"}
                </h2>
                <p className="font-body mt-1.5" style={{color:"rgba(26,16,37,0.5)",fontSize:"0.88rem"}}>
                  {pinStage === "enter" ? "4 अंकों का PIN चुनें" : "पुष्टि के लिए PIN फिर डालें"}
                </p>
              </div>

              <PinDots value={pinStage === "enter" ? pin : confirm} />
              {err && <Err msg={err} />}
              <NumPad onPress={handlePinPress} onDelete={handlePinDelete} />

              <button type="button" onClick={() => { setPinStage("enter"); go("age"); }}
                className="font-body text-center underline underline-offset-2 p-0 min-h-0 h-auto text-sm self-center"
                style={{color:"rgba(26,16,37,0.38)"}}>
                PIN छोड़ें
              </button>
            </Card>
          )}

          {/* ── SCREEN 3: AGE ────────────────────────────────── */}
          {step === "age" && (
            <Card key="age" dir={dir}>
              <BackBtn onClick={() => { setPinStage("enter"); setPin(""); setConfirm(""); go("pin", -1); }} />
              <div className="text-center">
                <div className="text-5xl mb-3">🎂</div>
                <h2 className="font-display font-bold text-ink" style={{fontSize:"1.55rem"}}>बच्चे की उम्र</h2>
                <p className="font-body mt-1.5" style={{color:"rgba(26,16,37,0.5)",fontSize:"0.88rem"}}>
                  सही अनुभव के लिए उम्र बताएं
                </p>
              </div>

              <AgeAvatar age={age} />

              <div className="flex flex-col items-center gap-1">
                <motion.div key={age} initial={{scale:0.7,opacity:0}} animate={{scale:1,opacity:1}}
                  transition={{type:"spring",stiffness:400,damping:20}}
                  className="font-display font-extrabold" style={{fontSize:"5rem",lineHeight:1,color:"var(--magic)"}}>
                  {age}<span className="font-body font-normal text-2xl ml-1" style={{color:"rgba(26,16,37,0.4)"}}>साल</span>
                </motion.div>

                <div className="relative w-full h-12 flex items-center">
                  <div className="absolute inset-0 flex items-center px-2">
                    <div className="w-full h-3 rounded-full" style={{background:"rgba(26,16,37,0.1)"}}>
                      <div className="h-full rounded-full transition-all duration-200"
                        style={{width:`${((age-4)/6)*100}%`,background:"linear-gradient(90deg,var(--magic),var(--magic-bright))"}}/>
                    </div>
                  </div>
                  <input type="range" min={4} max={10} step={1} value={age}
                    onChange={e => setAge(Number(e.target.value))}
                    className="relative w-full h-12 cursor-pointer" style={{opacity:0}}/>
                </div>
                <div className="flex justify-between w-full font-body text-xs" style={{color:"rgba(26,16,37,0.35)"}}>
                  <span>4 साल</span><span>10 साल</span>
                </div>
              </div>

              {err && <Err msg={err} />}

              <button type="button" onClick={handleFinish} disabled={busy}
                className="btn-primary w-full" style={{fontSize:"1.1rem"}}>
                {busy ? <Dots/> : "शुरू करें 🌟"}
              </button>
            </Card>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────
function Card({ children, dir }: { children: React.ReactNode; dir: number }) {
  return (
    <motion.div custom={dir}
      initial={{ x: dir>0?60:-60, opacity:0 }}
      animate={{ x:0, opacity:1 }}
      exit={{ x: dir<0?60:-60, opacity:0 }}
      transition={{ duration:0.28, ease:[0.16,1,0.3,1] }}
      className="card p-6 flex flex-col gap-5">
      {children}
    </motion.div>
  );
}
function BackBtn({ onClick }: { onClick: ()=>void }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-1.5 font-body text-sm p-0 min-h-0 h-auto w-fit"
      style={{color:"rgba(26,16,37,0.42)"}}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="15 18 9 12 15 6"/>
      </svg>
      वापस
    </button>
  );
}
function Err({ msg }: { msg: string }) {
  return (
    <motion.p initial={{opacity:0,y:-4}} animate={{opacity:1,y:0}}
      className="font-body text-sm text-center -mt-2" style={{color:"var(--warn)"}}>
      ⚠️ {msg}
    </motion.p>
  );
}
function Dots() {
  return (
    <span className="flex gap-1 items-center">
      {[0,1,2].map(i=>(
        <motion.span key={i} className="inline-block rounded-full bg-current" style={{width:5,height:5}}
          animate={{opacity:[0.3,1,0.3],y:[0,-4,0]}}
          transition={{duration:0.8,repeat:Infinity,delay:i*0.15}}/>
      ))}
    </span>
  );
}
