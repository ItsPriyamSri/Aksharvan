"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { SpeakerCharacter } from "@/types/audio";

const CHARS: Record<SpeakerCharacter,{ src:string; label:string; color:string }> = {
  tina: { src:"/characters/Tina_transparent.png", label:"टीना", color:"var(--tina)" },
  toto: { src:"/characters/Toto_transparent.png", label:"टोटो", color:"var(--toto)" },
};

const SIZES: Record<string,{ h:string; w:string; bubble:string }> = {
  xs: { h:"h-16", w:"w-12", bubble:"text-xs max-w-[110px]" },
  sm: { h:"h-24", w:"w-18", bubble:"text-xs max-w-[140px]" },
  md: { h:"h-32", w:"w-24", bubble:"text-sm max-w-[165px]" },
  lg: { h:"h-44", w:"w-32", bubble:"text-sm max-w-[190px]" },
};

export default function CharacterDisplay({ character,isActive,isSpeaking=false,dialogue,size="md",className="",flip=false,noBubble=false }: {
  character:SpeakerCharacter; isActive:boolean; isSpeaking?:boolean; dialogue?:string;
  size?:string; className?:string; flip?:boolean; noBubble?:boolean;
}) {
  const c  = CHARS[character];
  const sz = SIZES[size]??SIZES.md;
  return (
    <div className={`flex flex-col items-center gap-1.5 ${className}`}>
      <AnimatePresence mode="wait">
        {!noBubble&&dialogue&&(
          <motion.div key={dialogue}
            initial={{opacity:0,y:8,scale:0.9}} animate={{opacity:1,y:0,scale:1}} exit={{opacity:0,y:-5,scale:0.9}}
            transition={{duration:0.2,ease:[0.16,1,0.3,1]}}
            className={`relative bg-white rounded-2xl px-3 py-2 text-center font-body font-semibold text-ink leading-snug ${sz.bubble}`}
            style={{ boxShadow:`0 0 0 2px ${c.color}44, 0 4px 14px rgba(0,0,0,0.18)` }}>
            {dialogue}
            <span className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0"
              style={{ borderLeft:"7px solid transparent",borderRight:"7px solid transparent",borderTop:"8px solid white" }}/>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.div className="relative flex items-end justify-center"
        animate={{ y:[0,-8,-3,-10,0],rotate:flip?[0,1.2,-0.8,1.2,0]:[0,-1.2,0.8,-1.2,0] }}
        transition={{ duration:5,repeat:Infinity,ease:"easeInOut" }}>
        <AnimatePresence>
          {isActive&&(
            <motion.div initial={{opacity:0}} animate={{opacity:isSpeaking?[0.4,0.8,0.4]:0.6,scale:isSpeaking?[1,1.06,1]:1}}
              exit={{opacity:0}} transition={{duration:isSpeaking?1.2:0.3,repeat:isSpeaking?Infinity:0}}
              className="absolute inset-0 rounded-full pointer-events-none"
              style={{ background:`radial-gradient(circle,${c.color}35 30%,transparent 70%)`,
                boxShadow:`0 0 32px 10px ${c.color}40` }} />
          )}
        </AnimatePresence>
        <img src={c.src} alt={c.label}
          className={`${sz.h} ${sz.w} object-contain object-bottom select-none relative z-10`}
          style={{ transform:flip?"scaleX(-1)":undefined,
            filter:isActive?`drop-shadow(0 0 14px ${c.color}) drop-shadow(0 5px 10px rgba(0,0,0,0.45))`:"drop-shadow(0 4px 10px rgba(0,0,0,0.4))" }}
          draggable={false}/>
        {isSpeaking&&isActive&&[0,1].map(i=>(
          <motion.div key={i} className="absolute inset-0 rounded-full border-2 pointer-events-none"
            style={{ borderColor:c.color }}
            animate={{ scale:[1,1.6+i*0.3],opacity:[0.5,0] }}
            transition={{ duration:1.5,repeat:Infinity,delay:i*0.75,ease:"easeOut" }} />
        ))}
      </motion.div>
      <div className="px-2 py-0.5 rounded-full font-display font-bold text-white"
        style={{ background:c.color,fontSize:"10px" }}>{c.label}</div>
    </div>
  );
}
