"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";

type MicState = "idle"|"listening"|"processing"|"success"|"error"|"unsupported";

const CFG = {
  idle:        { bg:"rgba(124,92,191,0.12)", border:"rgba(124,92,191,0.35)", icon:"🎤", label:"बोलो" },
  listening:   { bg:"rgba(124,92,191,0.25)", border:"var(--magic)",          icon:"🔴", label:"सुन रहे हैं…" },
  processing:  { bg:"rgba(78,205,196,0.15)", border:"var(--toto)",           icon:"⏳", label:"समझ रहे हैं…" },
  success:     { bg:"rgba(0,200,150,0.12)",  border:"var(--success)",        icon:"✅", label:"शाबाश!" },
  error:       { bg:"rgba(255,107,107,0.12)",border:"var(--warn)",           icon:"🔄", label:"फिर बोलो" },
  unsupported: { bg:"rgba(255,248,237,0.04)",border:"rgba(255,248,237,0.1)", icon:"🎤", label:"उपलब्ध नहीं" },
};

export default function MicButton({ state,onTap,transcript,error }: {
  state:MicState; onTap:()=>void; transcript?:string; error?:string|null;
}) {
  const cfg = CFG[state];
  return (
    <div className="flex flex-col items-center gap-1.5">
      <motion.button type="button" onClick={onTap}
        disabled={state==="processing"||state==="unsupported"}
        whileTap={state!=="processing"?{scale:0.88}:{}}
        className="relative w-12 h-12 rounded-full flex items-center justify-center transition-colors"
        style={{ background:cfg.bg,border:`2px solid ${cfg.border}` }}>
        {state==="listening"&&(
          <>
            {[0,1,2].map(i=>(
              <motion.div key={i} className="absolute inset-0 rounded-full border-2"
                style={{ borderColor:"var(--magic)" }}
                animate={{ scale:[1,2+i*0.4],opacity:[0.5,0] }}
                transition={{ duration:1.3,repeat:Infinity,delay:i*0.4,ease:"easeOut" }} />
            ))}
          </>
        )}
        <span className="text-lg relative z-10">{cfg.icon}</span>
      </motion.button>
      <AnimatePresence mode="wait">
        <motion.p key={state} initial={{opacity:0,y:3}} animate={{opacity:1,y:0}} exit={{opacity:0}}
          className="font-body text-xs text-center"
          style={{ color:state==="success"?"var(--success)":state==="error"?"var(--warn)":state==="listening"?"var(--magic-bright)":"rgba(255,248,237,0.4)" }}>
          {error&&state==="error"?error:cfg.label}
        </motion.p>
      </AnimatePresence>
      {transcript&&(state==="processing"||state==="success")&&(
        <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}}
          className="px-3 py-1 rounded-xl" style={{ background:"rgba(255,248,237,0.08)",border:"1px solid rgba(255,248,237,0.12)" }}>
          <p className="akshar text-surface text-sm">&quot;{transcript}&quot;</p>
        </motion.div>
      )}
    </div>
  );
}
