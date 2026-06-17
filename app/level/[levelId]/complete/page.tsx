"use client";

import React, { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useRouteGuard }    from "@/hooks/useRouteGuard";
import { useProgress }      from "@/contexts/ProgressContext";
import { useNarration }     from "@/hooks/useNarration";
import { useAudio }         from "@/contexts/AudioContext";
import { getLevel, DEFAULT_LEVEL_ID } from "@/lib/content/registry";
import { LEVEL_COMPLETE_DIALOGUE } from "@/lib/content/audio-resolver";
import CharacterDisplay     from "@/components/characters/CharacterDisplay";
import LoadingScreen        from "@/components/ui/LoadingScreen";
import type { SpeakerCharacter } from "@/types/audio";

const STAGES = [
  { s:0, label:"रंग वापस आए",        emoji:"🎨", color:"var(--magic)" },
  { s:1, label:"घास उगी",            emoji:"🌱", color:"#66BB6A" },
  { s:2, label:"पेड़ खड़े हुए",       emoji:"🌳", color:"var(--forest-bright)" },
  { s:3, label:"नदी बही",            emoji:"💧", color:"var(--toto)" },
  { s:4, label:"जानवर आए",           emoji:"🦁", color:"var(--firefly)" },
  { s:5, label:"पक्षी उड़े",          emoji:"🦋", color:"var(--tina)" },
  { s:6, label:"जंगल जी उठा! 🎉",   emoji:"✨", color:"var(--success)" },
];

export default function CompletePage() {
  const params = useParams<{ levelId:string }>();
  const router = useRouter();
  const { isChecking } = useRouteGuard({ mode:"require-auth" });
  const { progress } = useProgress();
  const { narrate, stop } = useNarration();
  const { unlockAudio } = useAudio();
  const [speakingChar, setSpeakingChar] = useState<SpeakerCharacter | null>("tina");
  const lineIdxRef = useRef(0);

  const levelId = params?.levelId??DEFAULT_LEVEL_ID;
  const level   = getLevel(levelId);
  const stage   = Math.min(progress?.restorationStage??0, STAGES.length-1);
  const curr    = STAGES[stage];
  const allDone = progress?.sublevels.every(sl=>sl.status==="completed")??false;

  useEffect(() => {
    unlockAudio();
    lineIdxRef.current = 0;
    setSpeakingChar("tina");

    const speakNext = () => {
      const idx = lineIdxRef.current;
      if (idx >= LEVEL_COMPLETE_DIALOGUE.length) {
        setSpeakingChar(null);
        return;
      }
      const line = LEVEL_COMPLETE_DIALOGUE[idx];
      lineIdxRef.current = idx + 1;
      setSpeakingChar(line.speaker);
      narrate(line.audioId, line.textHi, line.speaker, speakNext);
    };

    speakNext();
    return () => stop();
  }, [narrate, stop, unlockAudio]);

  if (isChecking) return <LoadingScreen />;

  const STARS = [[5,3],[20,8],[38,5],[58,2],[72,9],[88,6],[12,18],[50,14],[80,11]];

  return (
    <div className="relative min-h-dvh flex flex-col items-center justify-center overflow-hidden screen-safe pb-safe"
      style={{ background:"linear-gradient(180deg,#050e08 0%,#0d2518 40%,#1a4a28 80%,#2d7050 100%)" }}>
      {STARS.map(([x,y],i)=>(
        <motion.div key={i} className="absolute rounded-full bg-white pointer-events-none"
          style={{ left:`${x}%`,top:`${y}%`,width:2,height:2 }}
          animate={{ opacity:[0.1,0.8,0.1] }} transition={{ duration:2+i*0.5,repeat:Infinity,delay:i*0.4 }} />
      ))}
      {/* Burst particles */}
      {Array.from({length:30},(_,i)=>{
        const a=(i/30)*360,r=90+(i%5)*30;
        return (
          <motion.div key={i} className="absolute rounded-full pointer-events-none"
            style={{ width:4+(i%4),height:4+(i%4),background:i%3===0?"var(--firefly)":i%3===1?"var(--success)":"var(--tina)" }}
            initial={{x:"50%",y:"50%",opacity:0,scale:0}}
            animate={{x:`calc(50% + ${Math.cos(a*Math.PI/180)*r}px)`,y:`calc(50% + ${Math.sin(a*Math.PI/180)*r}px)`,opacity:[0,1,0],scale:[0,1.5,0]}}
            transition={{ duration:1.5,delay:i*0.05+0.2,ease:"easeOut" }} />
        );
      })}

      <motion.div initial={{opacity:0}} animate={{opacity:1}}
        className="relative z-10 flex flex-col items-center gap-5 px-5 text-center w-full max-w-sm">

        {/* Trophy */}
        <motion.div initial={{scale:0.5,opacity:0}} animate={{scale:1,opacity:1}}
          transition={{type:"spring",stiffness:260,damping:16,delay:0.15}}>
          <div className="text-8xl">🏆</div>
          <h1 className="font-display font-extrabold gold mt-2" style={{ fontSize:"2.8rem" }}>
            {allDone ? "जंगल बचाया!" : level?.feedback.correct[0]??"शाबाश!"}
          </h1>
          <p className="font-body mt-1.5 leading-deva" style={{ color:"rgba(255,248,237,0.7)",fontSize:"1rem" }}>
            {level ? `${level.title} की रोशनी वापस आई!` : "स्तर पूरा!"}
          </p>
        </motion.div>

        {/* Forest restoration */}
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.4}}
          className="w-full rounded-3xl p-4" style={{ background:"rgba(0,0,0,0.25)",border:"1.5px solid rgba(255,248,237,0.1)" }}>
          <p className="font-body text-xs mb-3 text-center" style={{ color:"rgba(255,248,237,0.4)" }}>जंगल की बहाली</p>
          <div className="flex gap-1 mb-3">
            {STAGES.slice(0,6).map((s,i)=>(
              <motion.div key={i} initial={{scaleX:0}} animate={{scaleX:i<stage?1:0}}
                transition={{delay:0.5+i*0.12,duration:0.5,ease:"easeOut"}}
                className="flex-1 h-2 rounded-full origin-left"
                style={{ background:i<stage?s.color:"rgba(255,248,237,0.1)" }} />
            ))}
          </div>
          <div className="flex items-center justify-center gap-2">
            <motion.span animate={{scale:[1,1.3,1]}} transition={{duration:1.8,repeat:Infinity}} style={{ fontSize:22 }}>{curr.emoji}</motion.span>
            <span className="font-body text-sm font-semibold" style={{ color:curr.color }}>{curr.label}</span>
          </div>
        </motion.div>

        {/* Characters */}
        <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.55}}
          className="flex gap-6 justify-center">
          <CharacterDisplay
            character="tina"
            isActive={speakingChar === "tina"}
            isSpeaking={speakingChar === "tina"}
            dialogue={LEVEL_COMPLETE_DIALOGUE[0].textHi}
            size="md"
          />
          <CharacterDisplay
            character="toto"
            isActive={speakingChar === "toto"}
            isSpeaking={speakingChar === "toto"}
            flip
            dialogue={LEVEL_COMPLETE_DIALOGUE[1].textHi}
            size="md"
          />
        </motion.div>

        {/* Buttons */}
        <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:0.7}}
          className="flex flex-col gap-3 w-full">
          <button type="button" onClick={()=>router.push("/map")} className="btn-primary w-full">
            नक्शे पर जाएं 🗺️
          </button>
          <button type="button" onClick={()=>router.push("/menu")}
            className="btn-ghost w-full">
            मुख्य मेनू
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
