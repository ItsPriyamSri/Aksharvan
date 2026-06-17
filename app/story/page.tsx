"use client";
// STORY INTRO — cinematic dialogue between Tina and Toto
// Shown after intro video, before map screen

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import { useProgress }   from "@/contexts/ProgressContext";
import { useNarration }  from "@/hooks/useNarration";
import { useAudio }      from "@/contexts/AudioContext";
import LoadingScreen     from "@/components/ui/LoadingScreen";

const SCENES = [
  {
    speaker: "tina" as const,
    text: "जंगल को बचाने के लिए कुछ सवालों के जवाब दो!",
    audioId: "story_hook_tina",
    subtext: "Tina",
    emoji: "🌳",
    bg: "linear-gradient(180deg,#040C08 0%,#0A1F12 50%,#0D2818 100%)",
  },
  {
    speaker: "toto" as const,
    text: "चलो सीखते हैं और जंगल को फिर से हरा-भरा बनाते हैं!",
    audioId: "story_hook_toto",
    subtext: "Toto",
    emoji: "✨",
    bg: "linear-gradient(180deg,#040C12 0%,#081828 50%,#0A2030 100%)",
  },
];

export default function StoryPage() {
  const router = useRouter();
  const { isChecking } = useRouteGuard({ mode: "require-auth" });
  const { markIntroSeen } = useProgress();
  const { narrate, stop } = useNarration();
  const { unlockAudio } = useAudio();
  const [sceneIdx, setSceneIdx] = useState(0);
  const [exiting, setExiting] = useState(false);

  const scene = SCENES[sceneIdx];

  useEffect(() => {
    unlockAudio();
    narrate(scene.audioId, scene.text, scene.speaker);
    return () => stop();
  }, [sceneIdx, scene.audioId, scene.text, scene.speaker, narrate, stop, unlockAudio]);

  const advance = useCallback(async () => {
    if (sceneIdx < SCENES.length - 1) {
      setSceneIdx(i => i + 1);
    } else {
      setExiting(true);
      await markIntroSeen();
      router.replace("/map");
    }
  }, [sceneIdx, markIntroSeen, router]);

  if (isChecking) return <LoadingScreen />;

  const isTina = scene.speaker === "tina";

  return (
    <motion.div className="relative h-dvh flex flex-col overflow-hidden screen-safe"
      animate={exiting ? { opacity: 0 } : { opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ background: scene.bg }}>

      {/* Ambient particles */}
      {[{x:10,y:20,s:3},{x:80,y:15,s:4},{x:55,y:60,s:3},{x:25,y:75,s:4},{x:88,y:45,s:3}].map((p,i)=>(
        <motion.div key={i} className="absolute rounded-full pointer-events-none"
          style={{ left:`${p.x}%`,top:`${p.y}%`,width:p.s,height:p.s,
            background:"var(--firefly)",boxShadow:`0 0 ${p.s*3}px var(--firefly-glow)` }}
          animate={{ y:[0,-18,0],opacity:[0.2,0.8,0.2] }}
          transition={{ duration:4+i,repeat:Infinity,delay:i*0.8 }}/>
      ))}

      {/* Tree silhouettes */}
      <svg className="absolute bottom-0 w-full pointer-events-none" viewBox="0 0 430 160" preserveAspectRatio="none" style={{height:160}}>
        <path d="M-5 160 L25 80 L55 160Z M45 160 L82 68 L119 160Z M252 160 L288 70 L324 160Z M320 160 L355 82 L390 160Z" fill="#071510" opacity="0.95"/>
        <path d="M0 145 Q107 130 215 140 Q323 150 430 134 L430 160 L0 160Z" fill="#050F0A"/>
      </svg>

      {/* Skip */}
      <button type="button" onClick={advance}
        className="absolute top-5 right-5 z-20 px-3 py-1.5 rounded-full font-body text-sm"
        style={{ background:"rgba(255,248,237,0.1)",color:"rgba(255,248,237,0.5)",border:"1px solid rgba(255,248,237,0.15)" }}>
        छोड़ें ›
      </button>

      {/* Main content */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 gap-8">

        {/* Scene emoji */}
        <motion.div key={`emoji-${sceneIdx}`}
          initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}>
          <div className="text-7xl text-center">{scene.emoji}</div>
        </motion.div>

        {/* Characters + dialogue */}
        <AnimatePresence mode="wait">
          <motion.div key={`scene-${sceneIdx}`}
            initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="w-full flex flex-col items-center gap-4">

            {/* Character name badge */}
            <div className="px-4 py-1.5 rounded-full font-display font-bold text-sm"
              style={{ background: isTina ? "rgba(255,107,157,0.2)" : "rgba(78,205,196,0.2)",
                border: `1.5px solid ${isTina ? "var(--tina)" : "var(--toto)"}`,
                color: isTina ? "var(--tina)" : "var(--toto)" }}>
              {isTina ? "🌸 टीना" : "🌊 टोटो"}
            </div>

            {/* Dialogue bubble */}
            <div className="w-full px-6 py-5 rounded-3xl relative"
              style={{ background: "rgba(255,248,237,0.95)", boxShadow: "0 8px 32px rgba(0,0,0,0.3)" }}>
              <p className="font-display font-bold text-ink text-center leading-deva"
                style={{ fontSize: "clamp(1.1rem,5vw,1.35rem)" }}>
                {scene.text}
              </p>
            </div>

            {/* Characters */}
            <div className="flex items-end justify-center gap-8">
              {/* Tina */}
              <motion.div animate={{ opacity: isTina ? 1 : 0.4, scale: isTina ? 1 : 0.85 }} transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-1">
                <motion.img src="/characters/Tina_Puppet.png" alt="टीना"
                  animate={isTina ? { y: [0,-8,-3,-10,0], rotate: [0,-1.5,1,-1.5,0] } : { y: 0 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="object-contain object-bottom"
                  style={{ width: 90, height: 125,
                    filter: isTina ? "drop-shadow(0 0 16px var(--tina))" : "none" }}
                  draggable={false}/>
                <span className="font-body text-xs font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: "var(--tina)", fontSize: 10 }}>टीना</span>
              </motion.div>

              {/* Toto */}
              <motion.div animate={{ opacity: !isTina ? 1 : 0.4, scale: !isTina ? 1 : 0.85 }} transition={{ duration: 0.3 }}
                className="flex flex-col items-center gap-1">
                <motion.img src="/characters/Toto_Puppet.png" alt="टोटो"
                  animate={!isTina ? { y: [0,-8,-3,-10,0], rotate: [0,1.5,-1,1.5,0] } : { y: 0 }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                  className="object-contain object-bottom"
                  style={{ width: 90, height: 125, transform: "scaleX(-1)",
                    filter: !isTina ? "drop-shadow(0 0 16px var(--toto))" : "none" }}
                  draggable={false}/>
                <span className="font-body text-xs font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ background: "var(--toto)", fontSize: 10 }}>टोटो</span>
              </motion.div>
            </div>

          </motion.div>
        </AnimatePresence>

        {/* Scene dots */}
        <div className="flex gap-2">
          {SCENES.map((_, i) => (
            <div key={i} className="w-2 h-2 rounded-full transition-all"
              style={{ background: i === sceneIdx ? "var(--firefly)" : "rgba(255,248,237,0.25)",
                width: i === sceneIdx ? 16 : 8 }} />
          ))}
        </div>
      </div>

      {/* Tap anywhere to continue */}
      <motion.button type="button" onClick={advance}
        className="relative z-10 mx-5 mb-8 btn-primary w-auto self-center flex items-center gap-2"
        style={{ minWidth: 180 }}
        animate={{ scale: [1, 1.03, 1] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
        {sceneIdx < SCENES.length - 1 ? "अगला →" : "नक्शे पर जाएं 🗺️"}
      </motion.button>

    </motion.div>
  );
}
