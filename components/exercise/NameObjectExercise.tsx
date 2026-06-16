"use client";

// NameObjectExercise — "यह क्या है?"
// Each card shows the fully animated SVG + Hindi name.
// Cards are large, touch-friendly, and visually exciting.

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { NameObjectExercise as T, ObjectCard } from "@/types/content";
import type { ExercisePhase } from "@/hooks/useExerciseState";

// Emoji fallback if SVG fails
const EMOJI: Record<string,string> = {
  "obj-batakh":"🦆","obj-sapera":"🪗","obj-patang":"🪁","obj-rassi":"🪢","obj-anaar":"🍎",
  "obj-ghadi":"⏰","obj-tarbooj":"🍉","obj-kachua":"🐢","obj-chammach":"🥄","obj-lattu":"🪀",
};

// Accent colour per object for the card glow
const ACCENT: Record<string,string> = {
  "obj-batakh":"#29B6F6","obj-sapera":"#66BB6A","obj-patang":"#FF7043","obj-rassi":"#8D6E63",
  "obj-anaar":"#E53935","obj-ghadi":"#FFB300","obj-tarbooj":"#4CAF50","obj-kachua":"#2E7D32",
  "obj-chammach":"#9E9E9E","obj-lattu":"#FF7043",
};

function ObjectCard({ card, isSelected, isCorrect, wasWrong, onSelect, disabled }: {
  card: ObjectCard; isSelected: boolean; isCorrect: boolean;
  wasWrong: boolean; onSelect: ()=>void; disabled: boolean;
}) {
  const [imgFailed, setImgFailed] = useState(false);
  const accent = ACCENT[card.id] ?? "#FFC84A";

  const borderColor = isCorrect && isSelected ? "var(--success)"
    : wasWrong ? "var(--warn)"
    : isSelected ? "#FFC84A"
    : "rgba(255,248,237,0.1)";

  const bgColor = isCorrect && isSelected ? "rgba(0,200,150,0.12)"
    : wasWrong ? "rgba(255,107,107,0.08)"
    : isSelected ? "rgba(255,200,74,0.08)"
    : "rgba(255,248,237,0.04)";

  const glowShadow = isCorrect && isSelected
    ? `0 0 30px rgba(0,200,150,0.45), 0 8px 24px rgba(0,0,0,0.3)`
    : wasWrong
    ? `0 0 20px rgba(255,107,107,0.35), 0 8px 24px rgba(0,0,0,0.3)`
    : isSelected
    ? `0 0 24px rgba(255,200,74,0.4), 0 8px 24px rgba(0,0,0,0.3)`
    : `0 4px 16px rgba(0,0,0,0.25)`;

  return (
    <motion.button
      type="button"
      onClick={() => !disabled && onSelect()}
      animate={wasWrong ? { x: [0,-14,14,-10,10,-5,5,0] } : { x: 0 }}
      transition={{ duration: 0.45 }}
      whileTap={!disabled ? { scale: 0.93 } : {}}
      disabled={disabled}
      aria-label={card.nameHi}
      className="relative flex flex-col items-center rounded-3xl overflow-hidden transition-all flex-1"
      style={{
        border: `2.5px solid ${borderColor}`,
        background: bgColor,
        boxShadow: glowShadow,
        cursor: disabled ? "default" : "pointer",
        minWidth: 0,
        padding: "16px 12px 12px",
      }}
    >
      {/* Animated image — large and centred */}
      <div className="rounded-2xl overflow-hidden flex items-center justify-center"
        style={{ width:"100%", aspectRatio:"1/1", maxWidth:140,
          background: `radial-gradient(circle,${accent}18 0%,transparent 70%)` }}>
        {!imgFailed ? (
          <img
            src={card.image}
            alt={card.nameHi}
            className="w-full h-full"
            style={{ objectFit:"contain" }}
            onError={() => setImgFailed(true)}
          />
        ) : (
          <span style={{ fontSize: 72 }}>{EMOJI[card.id] ?? "❓"}</span>
        )}
      </div>

      {/* Hindi name — bold, clear */}
      <div className="mt-3 px-2 py-1.5 rounded-xl w-full text-center"
        style={{ background:"rgba(0,0,0,0.25)" }}>
        <span className="font-display font-bold leading-none"
          style={{
            fontSize: "1.3rem",
            color: isCorrect && isSelected ? "var(--success)"
              : wasWrong ? "var(--warn)"
              : "rgba(255,248,237,0.95)",
          }}>
          {card.nameHi}
        </span>
      </div>

      {/* Correct badge */}
      {isCorrect && isSelected && (
        <motion.div initial={{scale:0,opacity:0}} animate={{scale:1,opacity:1}}
          transition={{type:"spring",stiffness:400,damping:15}}
          className="absolute -top-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-lg"
          style={{ background:"var(--success)", boxShadow:"0 4px 12px rgba(0,200,150,0.5)" }}>
          ✓
        </motion.div>
      )}

      {/* Wrong pulse */}
      {wasWrong && (
        <motion.div initial={{opacity:0}} animate={{opacity:[0,1,0]}} transition={{duration:0.6}}
          className="absolute inset-0 rounded-3xl"
          style={{ background:"rgba(255,107,107,0.15)", border:"2px solid var(--warn)" }} />
      )}
    </motion.button>
  );
}

export default function NameObjectExercise({ exercise, objectMap, phase, selectedId, onSelect, missCount }: {
  exercise: T; objectMap: Map<string, ObjectCard>; phase: ExercisePhase;
  selectedId: string|null; onSelect: (id:string)=>void; missCount: number;
}) {
  const isAnswering = phase === "answering";
  const isCorrect   = phase === "feedback_correct";
  const isRetry     = phase === "feedback_retry";

  return (
    <div className="flex flex-col gap-3 w-full">
      <div className="flex gap-3 w-full">
        {exercise.options.map(id => {
          const card = objectMap.get(id);
          if (!card) return null;
          return (
            <ObjectCard key={id} card={card}
              isSelected={selectedId === id}
              isCorrect={isCorrect && id === exercise.correct}
              wasWrong={isRetry && selectedId === id && id !== exercise.correct}
              onSelect={() => isAnswering && onSelect(id)}
              disabled={!isAnswering}
            />
          );
        })}
      </div>

      <AnimatePresence>
        {isAnswering && (
          <motion.p initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
            className="font-body text-center text-sm" style={{ color:"rgba(255,248,237,0.4)" }}>
            👆 सही चित्र पर टैप करें
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}
