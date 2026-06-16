"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAudio } from "@/contexts/AudioContext";
import type { ExercisePhase } from "@/hooks/useExerciseState";

function Burst() {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden>
      {Array.from({length:16},(_,i)=>{
        const angle=(i/16)*360;
        const r=50+(i%4)*15;
        const x=Math.cos(angle*Math.PI/180)*r;
        const y=Math.sin(angle*Math.PI/180)*r;
        return (
          <motion.div key={i} className="absolute rounded-full"
            style={{ width:5+(i%3),height:5+(i%3),left:"50%",top:"50%",marginLeft:"-3px",marginTop:"-3px",
              background:i%2?"var(--firefly)":"var(--success)" }}
            initial={{x:0,y:0,scale:1,opacity:1}}
            animate={{x,y,scale:0,opacity:0}}
            transition={{duration:0.7,delay:i*0.03,ease:"easeOut"}} />
        );
      })}
    </div>
  );
}

export default function AnswerFeedback({ phase,feedbackText,missCount,onAdvance,isLastExercise }: {
  phase:ExercisePhase; feedbackText:string; missCount:number; onAdvance:()=>void; isLastExercise:boolean;
}) {
  const { isMockMode } = useAudio();
  const isCorrect = phase==="feedback_correct";
  const isRetry   = phase==="feedback_retry";
  const show      = isCorrect||isRetry;
  const showBtn   = isMockMode||isRetry;

  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
          className="flex flex-col items-center gap-3 w-full">
          <motion.div initial={{scale:0.8,y:10}} animate={{scale:1,y:0}} exit={{scale:0.8,y:8}}
            transition={{type:"spring",stiffness:380,damping:22}}
            className="relative px-6 py-4 rounded-3xl text-center overflow-hidden w-full max-w-xs"
            style={{ background:isCorrect?"rgba(0,200,150,0.12)":"rgba(255,107,107,0.08)",
              border:`2px solid ${isCorrect?"var(--success)":"rgba(255,107,107,0.35)"}`,
              boxShadow:isCorrect?"0 0 28px rgba(0,200,150,0.3)":"0 0 20px rgba(255,107,107,0.15)" }}>
            {isCorrect&&<Burst />}
            <div className="text-3xl mb-1">{isCorrect?"🌟":"💪"}</div>
            <p className="font-display font-bold text-xl leading-deva"
              style={{ color:isCorrect?"var(--success)":"rgba(255,248,237,0.9)" }}>
              {feedbackText}
            </p>
            {isRetry&&<p className="font-body text-sm mt-1" style={{ color:"rgba(255,248,237,0.45)" }}>
              {missCount>=2?"एक बार और कोशिश करो":"हिम्मत रखो!"}
            </p>}
          </motion.div>

          <AnimatePresence>
            {showBtn&&(
              <motion.button type="button" onClick={onAdvance}
                initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} exit={{opacity:0}}
                transition={{delay:0.1}} whileTap={{scale:0.95}}
                className="btn-primary flex items-center gap-2">
                {isRetry
                  ? <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.5"/></svg>फिर से कोशिश करें</>
                  : isLastExercise ? <>अगला अभ्यास 🎉</>
                  : <><span>अगला</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg></>
                }
              </motion.button>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
