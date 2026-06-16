"use client";

import React, { useCallback, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { FirstSoundExercise as T, ObjectCard, LetterCard } from "@/types/content";
import type { ExercisePhase } from "@/hooks/useExerciseState";

const EMOJI: Record<string,string> = {
  "obj-batakh":"🦆","obj-sapera":"🪗","obj-patang":"🪁","obj-rassi":"🪢","obj-anaar":"🍎",
  "obj-ghadi":"⏰","obj-tarbooj":"🍉","obj-kachua":"🐢","obj-chammach":"🥄","obj-lattu":"🪀",
};

function LetterTile({ card,isSelected,isCorrect,wasWrong,onSelect,disabled }: {
  card:LetterCard;isSelected:boolean;isCorrect:boolean;wasWrong:boolean;onSelect:()=>void;disabled:boolean;
}) {
  const border = isCorrect&&isSelected?"2px solid var(--success)":isSelected&&!isCorrect?"2px solid var(--warn)":"2px solid rgba(255,248,237,0.15)";
  const bg = isCorrect&&isSelected?"rgba(0,200,150,0.12)":isSelected&&!isCorrect?"rgba(255,107,107,0.08)":"rgba(255,248,237,0.06)";
  return (
    <motion.button type="button" onClick={()=>!disabled&&onSelect()}
      animate={wasWrong?{x:[0,-12,12,-8,8,-4,4,0]}:{x:0}} transition={{duration:0.4}}
      whileTap={!disabled?{scale:0.88}:{}} disabled={disabled}
      className="relative rounded-3xl flex flex-col items-center justify-center gap-1 transition-all"
      style={{ width:110,height:110,border,background:bg,
        boxShadow:isCorrect&&isSelected?"0 0 28px rgba(0,200,150,0.35)":isSelected&&!isCorrect?"0 0 20px rgba(255,107,107,0.25)":"none",
        cursor:disabled?"default":"pointer" }}>
      <span className="akshar font-bold" style={{ fontSize:"3.5rem",lineHeight:1,
        color:isCorrect&&isSelected?"var(--success)":isSelected&&!isCorrect?"var(--warn)":"rgba(255,248,237,0.95)" }}>
        {card.glyph}
      </span>
      <span className="font-body text-xs" style={{ color:"rgba(255,248,237,0.35)" }}>{card.soundRoman}</span>
      {isCorrect&&isSelected&&(
        <motion.div initial={{scale:0}} animate={{scale:1}} transition={{type:"spring",stiffness:400,damping:15}}
          className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center font-bold text-white"
          style={{ background:"var(--success)",fontSize:14 }}>✓</motion.div>
      )}
    </motion.button>
  );
}

export default function FirstSoundExercise({ exercise,objectMap,letterMap,phase,selectedId,onSelect }: {
  exercise:T; objectMap:Map<string,ObjectCard>; letterMap:Map<string,LetterCard>;
  phase:ExercisePhase; selectedId:string|null; onSelect:(id:string)=>void;
}) {
  const [imgFailed,setImgFailed] = useState(false);
  const isAnswering = phase==="answering";
  const isCorrect   = phase==="feedback_correct";
  const isRetry     = phase==="feedback_retry";
  const obj = objectMap.get(exercise.objectRef);

  return (
    <div className="flex flex-col items-center gap-5 w-full">
      {/* Reference object */}
      {obj && (
        <motion.div initial={{scale:0.85,opacity:0}} animate={{scale:1,opacity:1}}
          className="rounded-3xl overflow-hidden flex items-center justify-center"
          style={{ width:100,height:100,background:"rgba(255,248,237,0.07)",border:"2px solid rgba(255,248,237,0.1)" }}>
          {!imgFailed
            ? <img src={obj.image} alt={obj.nameHi} className="w-full h-full object-contain p-2" onError={()=>setImgFailed(true)}/>
            : <span style={{ fontSize:48 }}>{EMOJI[obj.id]??"❓"}</span>
          }
        </motion.div>
      )}

      {/* Arrow label */}
      <div className="flex items-center gap-2">
        <div className="h-px w-10" style={{ background:"rgba(255,248,237,0.15)" }}/>
        <span className="font-body text-xs" style={{ color:"rgba(255,248,237,0.4)" }}>पहली आवाज़ कौन सी है?</span>
        <div className="h-px w-10" style={{ background:"rgba(255,248,237,0.15)" }}/>
      </div>

      {/* Letter tiles */}
      <div className="flex gap-4 justify-center">
        {exercise.options.map(id=>{
          const card=letterMap.get(id);
          if (!card) return null;
          return (
            <LetterTile key={id} card={card}
              isSelected={selectedId===id}
              isCorrect={isCorrect&&id===exercise.correct}
              wasWrong={isRetry&&selectedId===id&&id!==exercise.correct}
              onSelect={()=>isAnswering&&onSelect(id)}
              disabled={!isAnswering} />
          );
        })}
      </div>
      <AnimatePresence>
        {isAnswering&&(
          <motion.p initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="font-body text-xs text-center" style={{ color:"rgba(255,248,237,0.35)" }}>
            👆 सही अक्षर पर टैप करें
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
