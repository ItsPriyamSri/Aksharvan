"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSpeaker } from "@/contexts/SpeakerContext";
import type { ExercisePhase } from "@/hooks/useExerciseState";

export default function CharacterPromptBar({ promptTextHi, feedbackText, phase }: {
  promptTextHi:string; feedbackText:string; phase:ExercisePhase;
}) {
  const { activeSpeaker, listeningCharacter } = useSpeaker();
  const isFeedback = phase==="feedback_correct"||phase==="feedback_retry";
  const isCorrect  = phase==="feedback_correct";
  const isRetry    = phase==="feedback_retry";
  const text       = isFeedback ? feedbackText : promptTextHi;
  const speaker    = isFeedback ? listeningCharacter : activeSpeaker;
  const silent     = isFeedback ? activeSpeaker : listeningCharacter;

  const CHARS = {
    tina:{ src:"/characters/Tina_Face.png",color:"var(--tina)",label:"टीना" },
    toto:{ src:"/characters/Toto_Face.png",color:"var(--toto)",label:"टोटो" },
  };
  const sp = CHARS[speaker], si = CHARS[silent];

  const bubbleBg = isCorrect?"rgba(0,200,150,0.1)":isRetry?"rgba(255,107,107,0.07)":"rgba(255,248,237,0.95)";
  const bubbleBorder = isCorrect?"1.5px solid var(--success)":isRetry?"1.5px solid var(--warn)":"none";
  const bubbleColor  = isCorrect?"var(--success)":isRetry?"var(--warn)":"var(--ink)";

  return (
    <div className="flex items-end gap-2 px-1">
      {/* Silent character */}
      <motion.div animate={{opacity:0.35,scale:0.78}} className="shrink-0 flex flex-col items-center gap-0.5">
        <img src={si.src} alt={si.label} className="object-contain object-bottom"
          style={{ width:44,height:60,filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.4))",transform:silent==="toto"?"scaleX(-1)":undefined }} draggable={false}/>
      </motion.div>

      {/* Bubble */}
      <div className="flex-1 min-w-0">
        <AnimatePresence mode="wait">
          <motion.div key={`${phase}-${text}`}
            initial={{opacity:0,y:6,scale:0.94}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-4,scale:0.94}}
            transition={{duration:0.2,ease:[0.16,1,0.3,1]}}
            className="w-full px-4 py-3 rounded-2xl"
            style={{ background:bubbleBg,border:bubbleBorder,
              boxShadow:isCorrect?"0 0 16px rgba(0,200,150,0.25)":isRetry?"0 0 12px rgba(255,107,107,0.15)":"0 4px 16px rgba(0,0,0,0.18)" }}>
            <p className="font-body font-semibold leading-deva text-center"
              style={{ color:bubbleColor,fontSize:"clamp(0.82rem,4vw,0.95rem)" }}>
              {text}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Speaking character */}
      <motion.div animate={{opacity:1,scale:1}} className="shrink-0 flex flex-col items-center gap-0.5">
        <motion.img src={sp.src} alt={sp.label} className="object-contain object-bottom"
          animate={isFeedback||phase==="prompting"?{y:[0,-5,0],rotate:speaker==="toto"?[0,2,-2,0]:[0,-2,2,0]}:{y:[0,-3,0]}}
          transition={{duration:1.6,repeat:Infinity,ease:"easeInOut"}}
          style={{ width:52,height:72,filter:`drop-shadow(0 0 14px ${sp.color}) drop-shadow(0 4px 8px rgba(0,0,0,0.4))`,transform:speaker==="toto"?"scaleX(-1)":undefined }} draggable={false}/>
      </motion.div>
    </div>
  );
}
