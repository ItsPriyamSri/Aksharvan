"use client";

import React, { useEffect, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNarration } from "@/hooks/useNarration";
import { useAudio } from "@/contexts/AudioContext";
import LevelEntryScreen from "@/components/cutscene/LevelEntryScreen";
import type { SpeakerCharacter } from "@/types/audio";

type PuppetLine = {
  id: string;
  speaker: SpeakerCharacter;
  audioId: string;
  captionHi: string;
  puppetSrc: string;
  puppetAlt: string;
};

const LEVEL1_PUPPET_LINES: PuppetLine[] = [
  {
    id: "tina-intro",
    speaker: "tina",
    audioId: "cutscene_intro_03b",
    captionHi: "क्या आप हमारी मदद करेंगे?",
    puppetSrc: "/characters/Tina_Puppet.png",
    puppetAlt: "टीना",
  },
  {
    id: "toto-intro",
    speaker: "toto",
    audioId: "cutscene_intro_03a",
    captionHi: "हमें तुम्हारी मदद चाहिए। क्या तुम हमारे साथ चलोगे?",
    puppetSrc: "/characters/Toto_Puppet.png",
    puppetAlt: "टोटो",
  },
];

type EntryConfig = {
  imageSrc: string;
  captionHi: string;
  audioId: string;
  speaker: SpeakerCharacter;
};

type Props = {
  entry: EntryConfig;
  onComplete: () => void;
};

function PuppetLineScreen({
  line,
  onDone,
}: {
  line: PuppetLine;
  onDone: () => void;
}) {
  const { narrate, stop } = useNarration();
  const { unlockAudio } = useAudio();

  useEffect(() => {
    unlockAudio();
    narrate(line.audioId, line.captionHi, line.speaker, onDone);
    return () => stop();
  }, [line, narrate, stop, onDone, unlockAudio]);

  const glow = line.speaker === "tina" ? "var(--tina)" : "var(--toto)";

  return (
    <div className="relative flex items-center justify-center h-dvh bg-black overflow-hidden">
      <div
        className="relative h-full flex flex-col items-center justify-end pb-28 px-6"
        style={{ width: "min(100vw, calc(100dvh * 9 / 16))" }}
      >
        <motion.img
          key={line.id}
          src={line.puppetSrc}
          alt={line.puppetAlt}
          initial={{ opacity: 0, y: 24, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.45, ease: "easeOut" }}
          className="object-contain mb-6"
          style={{
            maxHeight: "55vh",
            filter: `drop-shadow(0 0 18px ${glow}) drop-shadow(0 6px 16px rgba(0,0,0,0.55))`,
            transform: line.speaker === "toto" ? "scaleX(-1)" : undefined,
          }}
          draggable={false}
        />
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-body font-semibold text-white text-center leading-deva"
          style={{
            fontSize: "clamp(1rem, 4.5vw, 1.2rem)",
            textShadow: "0 2px 10px rgba(0,0,0,0.9)",
          }}
        >
          {line.captionHi}
        </motion.p>
        <button
          type="button"
          onClick={onDone}
          className="mt-6 px-5 py-2 rounded-full font-body text-sm text-white/70"
          style={{ border: "1px solid rgba(255,255,255,0.25)" }}
        >
          आगे →
        </button>
      </div>
    </div>
  );
}

export default function LevelIntroSequence({ entry, onComplete }: Props) {
  const [step, setStep] = useState(0);

  const goNext = useCallback(() => {
    setStep((s) => s + 1);
  }, []);

  if (step < LEVEL1_PUPPET_LINES.length) {
    return (
      <AnimatePresence mode="wait">
        <PuppetLineScreen
          key={LEVEL1_PUPPET_LINES[step].id}
          line={LEVEL1_PUPPET_LINES[step]}
          onDone={goNext}
        />
      </AnimatePresence>
    );
  }

  return (
    <LevelEntryScreen
      imageSrc={entry.imageSrc}
      captionHi={entry.captionHi}
      audioId={entry.audioId}
      speaker={entry.speaker}
      onComplete={onComplete}
    />
  );
}

export { LEVEL1_PUPPET_LINES };
