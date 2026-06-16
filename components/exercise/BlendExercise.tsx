"use client";

import React, { useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { BlendExercise as T, LetterCard, WordCard } from "@/types/content";
import type { ExercisePhase } from "@/hooks/useExerciseState";

export default function BlendExercise({ exercise,letterMap,wordMap,phase,selectedId,onSelect }: {
  exercise:T; letterMap:Map<string,LetterCard>; wordMap:Map<string,WordCard>;
  phase:ExercisePhase; selectedId:string|null; onSelect:(id:string)=>void;
}) {
  const isAnswering = phase==="answering";
  const isCorrect   = phase==="feedback_correct";
  const isRetry     = phase==="feedback_retry";

  const letters = exercise.letterRefs.map(id=>letterMap.get(id)).filter(Boolean) as LetterCard[];
  const words   = exercise.options.map(id=>wordMap.get(id)).filter(Boolean) as WordCard[];

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {/* Letter blending display */}
      <div className="flex items-center gap-2">
        {letters.map((l,i)=>(
          <React.Fragment key={l.id}>
            <motion.div initial={{scale:0.7,opacity:0}} animate={{scale:1,opacity:1}}
              transition={{delay:i*0.15,type:"spring",stiffness:300,damping:18}}
              className="rounded-2xl flex flex-col items-center justify-center gap-1"
              style={{ width:76,height:76,background:"rgba(124,92,191,0.15)",border:"2px solid rgba(124,92,191,0.35)" }}>
              <span className="akshar font-bold" style={{ fontSize:"2.8rem",lineHeight:1,color:"rgba(255,248,237,0.95)" }}>{l.glyph}</span>
            </motion.div>
            {i < letters.length-1 && (
              <motion.span initial={{opacity:0}} animate={{opacity:1}} transition={{delay:0.3}}
                className="font-display font-bold text-2xl" style={{ color:"var(--firefly)" }}>+</motion.span>
            )}
          </React.Fragment>
        ))}
        <motion.span initial={{opacity:0,scale:0.5}} animate={{opacity:1,scale:1}}
          transition={{delay:0.5,type:"spring"}}
          className="font-display font-bold text-3xl" style={{ color:"var(--firefly)" }}> = ?</motion.span>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 w-full">
        <div className="flex-1 h-px" style={{ background:"rgba(255,248,237,0.1)" }}/>
        <span className="font-body text-xs" style={{ color:"rgba(255,248,237,0.35)" }}>शब्द चुनो</span>
        <div className="flex-1 h-px" style={{ background:"rgba(255,248,237,0.1)" }}/>
      </div>

      {/* Word options */}
      <div className="flex gap-3 flex-wrap justify-center">
        {words.map(w=>{
          const isSel = selectedId===w.id;
          const isCorr= isCorrect&&w.id===exercise.correct;
          const isWrong=isRetry&&isSel&&w.id!==exercise.correct;
          return (
            <motion.button key={w.id} type="button" onClick={()=>isAnswering&&onSelect(w.id)}
              animate={isWrong?{x:[0,-10,10,-7,7,-4,4,0]}:{x:0}} transition={{duration:0.4}}
              whileTap={!(!isAnswering)?{scale:0.92}:{}} disabled={!isAnswering}
              className="relative flex flex-col items-center justify-center rounded-3xl px-6 py-4 transition-all"
              style={{ border:`2px solid ${isCorr?"var(--success)":isSel&&!isCorr?"var(--warn)":"rgba(255,248,237,0.15)"}`,
                background:isCorr?"rgba(0,200,150,0.12)":isSel&&!isCorr?"rgba(255,107,107,0.08)":"rgba(255,248,237,0.05)",
                boxShadow:isCorr?"0 0 28px rgba(0,200,150,0.35)":isSel&&!isCorr?"0 0 20px rgba(255,107,107,0.25)":"none",
                cursor:!isAnswering?"default":"pointer",minWidth:100 }}>
              <span className="akshar font-bold" style={{ fontSize:"2.8rem",color:isCorr?"var(--success)":isSel&&!isCorr?"var(--warn)":"rgba(255,248,237,0.95)" }}>
                {w.glyph}
              </span>
              <span className="font-body text-xs mt-0.5" style={{ color:"rgba(255,248,237,0.4)" }}>{w.roman}</span>
              {isCorr&&(
                <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",stiffness:400,damping:15}}
                  className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center font-bold text-white"
                  style={{ background:"var(--success)",fontSize:14 }}>✓</motion.div>
              )}
            </motion.button>
          );
        })}
      </div>
      <AnimatePresence>
        {isAnswering&&(
          <motion.p initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="font-body text-xs" style={{ color:"rgba(255,248,237,0.35)" }}>
            👆 सही शब्द पर टैप करें
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
