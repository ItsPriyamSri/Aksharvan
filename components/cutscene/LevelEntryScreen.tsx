"use client";

import React, { useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNarration } from "@/hooks/useNarration";
import { useAudio } from "@/contexts/AudioContext";
import type { SpeakerCharacter } from "@/types/audio";

type Props = {
  imageSrc: string;
  captionHi: string;
  audioId: string;
  speaker: SpeakerCharacter;
  onComplete: () => void;
};

export default function LevelEntryScreen({
  imageSrc,
  captionHi,
  audioId,
  speaker,
  onComplete,
}: Props) {
  const { narrate, stop } = useNarration();
  const { unlockAudio } = useAudio();

  const finish = useCallback(() => {
    stop();
    onComplete();
  }, [stop, onComplete]);

  useEffect(() => {
    unlockAudio();
    narrate(audioId, captionHi, speaker);
    return () => stop();
  }, [audioId, captionHi, speaker, narrate, stop, unlockAudio]);

  return (
    <div className="relative flex items-center justify-center h-dvh bg-black overflow-hidden">
      <div
        className="relative h-full overflow-hidden"
        style={{ width: "min(100vw, calc(100dvh * 9 / 16))" }}
      >
        <motion.img
          src={imageSrc}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          initial={{ scale: 1 }}
          animate={{ scale: 1.1 }}
          transition={{ duration: 7, ease: "linear" }}
          draggable={false}
        />

        <div
          className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{ height: "45%", background: "linear-gradient(to top, rgba(0,0,0,0.82) 0%, transparent 100%)" }}
        />

        <motion.div
          className="absolute bottom-0 left-0 z-10 pointer-events-none"
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.45, ease: "easeOut" }}
        >
          <motion.img
            src="/characters/Tina_Puppet.png"
            alt="टीना"
            className="object-contain object-bottom"
            style={{
              height: 140,
              width: 98,
              filter: "drop-shadow(0 0 12px var(--tina)) drop-shadow(0 4px 10px rgba(0,0,0,0.6))",
            }}
            animate={{ y: [0, -9, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
        </motion.div>

        <motion.div
          className="absolute bottom-0 right-0 z-10 pointer-events-none"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.65, duration: 0.45, ease: "easeOut" }}
        >
          <motion.img
            src="/characters/Toto_Puppet.png"
            alt="टोटो"
            className="object-contain object-bottom"
            style={{
              height: 140,
              width: 98,
              filter: "drop-shadow(0 0 12px var(--toto)) drop-shadow(0 4px 10px rgba(0,0,0,0.6))",
              transform: "scaleX(-1)",
            }}
            animate={{ y: [0, -9, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          />
        </motion.div>

        <motion.div
          className="absolute left-0 right-0 z-20 text-center px-10"
          style={{ bottom: "22%" }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9, duration: 0.4 }}
        >
          <p
            className="font-body font-semibold text-white leading-deva"
            style={{
              fontSize: "clamp(0.9rem, 4vw, 1.05rem)",
              textShadow: "0 2px 8px rgba(0,0,0,0.95), 0 1px 3px rgba(0,0,0,0.9)",
            }}
          >
            {captionHi}
          </p>
        </motion.div>

        <motion.button
          type="button"
          onClick={finish}
          className="absolute left-1/2 z-20 px-8 py-3 rounded-full font-display font-bold"
          style={{
            bottom: "8%",
            transform: "translateX(-50%)",
            background: "var(--firefly)",
            color: "#1A0A00",
            fontSize: "1rem",
            boxShadow: "0 4px 20px rgba(255,200,74,0.5)",
          }}
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1.3, duration: 0.4 }}
          whileTap={{ scale: 0.9 }}
        >
          शुरू करें →
        </motion.button>
      </div>
    </div>
  );
}
