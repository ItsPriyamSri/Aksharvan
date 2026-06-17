"use client";

import React, { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Level, LetterCard } from "@/types/content";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useNarration } from "@/hooks/useNarration";
import { useProgress } from "@/contexts/ProgressContext";
import { useAudio } from "@/contexts/AudioContext";
import {
  getScenePromptAudioId,
  pickPraiseAudioId,
  pickRetryAudioId,
  type ScenePromptKind,
} from "@/lib/content/audio-resolver";
import type { SpeakerCharacter } from "@/types/audio";

const FOREST_BG = [
  "linear-gradient(180deg,#0A0810 0%,#180E28 55%,#120820 100%)",
  "linear-gradient(180deg,#0A1005 0%,#182010 55%,#0D1808 100%)",
  "linear-gradient(180deg,#080E05 0%,#1A3A15 55%,#0D2010 100%)",
  "linear-gradient(180deg,#050B15 0%,#102535 55%,#1A3020 100%)",
  "linear-gradient(180deg,#050E06 0%,#1A3A18 40%,#2A5030 100%)",
  "linear-gradient(180deg,#080D18 0%,#1A3828 40%,#2A5838 100%)",
];

type SceneType = "name_object" | "first_sound" | "name_object2" | "first_sound2" | "blend" | "memory" | "word_build";
type SceneState = "intro" | "listening" | "correct" | "wrong";
type MicState = "idle" | "auto_start" | "listening" | "processing" | "success" | "error";

const SCENE_ORDER: SceneType[] = ["name_object", "first_sound", "name_object2", "first_sound2", "blend", "memory", "word_build"];
const VOICE_SCENES = new Set<SceneType>(["name_object", "first_sound", "name_object2", "first_sound2", "blend"]);

function sceneToPromptKind(sceneType: SceneType): ScenePromptKind {
  if (sceneType === "name_object" || sceneType === "name_object2") return "name_object";
  if (sceneType === "first_sound" || sceneType === "first_sound2") return "first_sound";
  return sceneType;
}

type Props = {
  level: Level;
  sublevelIndex: number;
  onComplete: (completedSublevelIndex: number) => void;
  onBack: () => void;
};

// ── Object image ───────────────────────────────────────────
function ObjectDisplay({
  src, nameHi, large = false, onTap,
}: {
  src: string; nameHi: string; large?: boolean; onTap?: () => void;
}) {
  const [failed, setFailed] = useState(false);
  const EMOJI: Record<string, string> = {
    "/objects/Battakh.JPG": "🦆", "/objects/Sapera.JPG": "🪗", "/objects/Patang.JPG": "🪁",
    "/objects/Rassi.JPG": "🪢",  "/objects/Anaar.JPG": "🍎",  "/objects/Ghadi.JPG": "⏰",
    "/objects/Tarbooz.JPG": "🍉", "/objects/Kachhua.JPG": "🐢", "/objects/Chammach.JPG": "🥄", "/objects/Lattu.JPG": "🪀",
  };
  const size = large ? 180 : 140;
  const inner = (
    <>
      {!failed
        ? <img src={src} alt={nameHi} className="w-full h-full object-contain" onError={() => setFailed(true)} />
        : <span style={{ fontSize: size * 0.55 }}>{EMOJI[src] ?? "❓"}</span>
      }
    </>
  );
  return (
    <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 20 }}
      className="flex flex-col items-center gap-3">
      {onTap ? (
        <motion.button type="button" onClick={onTap} whileTap={{ scale: 0.94 }}
          className="rounded-3xl overflow-hidden flex items-center justify-center"
          style={{ width: size, height: size, background: "rgba(255,248,237,0.07)", border: "2px solid rgba(255,248,237,0.12)" }}>
          {inner}
        </motion.button>
      ) : (
        <div className="rounded-3xl overflow-hidden flex items-center justify-center"
          style={{ width: size, height: size, background: "rgba(255,248,237,0.07)", border: "2px solid rgba(255,248,237,0.12)" }}>
          {inner}
        </div>
      )}
    </motion.div>
  );
}

// ── Mic button ─────────────────────────────────────────────
function BigMicButton({ state, onTap }: { state: MicState; onTap: () => void }) {
  const cfg: Record<MicState, { bg: string; border: string; icon: string; label: string; color: string }> = {
    idle:       { bg: "rgba(255,200,74,0.15)",  border: "rgba(255,200,74,0.5)",  icon: "🎤", label: "बोलो",          color: "var(--firefly)"      },
    auto_start: { bg: "rgba(124,92,191,0.15)",  border: "rgba(124,92,191,0.4)", icon: "🎤", label: "माइक दबाएँ",    color: "var(--magic-bright)" },
    listening:  { bg: "rgba(124,92,191,0.25)",  border: "var(--magic)",          icon: "🔴", label: "सुन रहे हैं…",  color: "var(--magic-bright)" },
    processing: { bg: "rgba(78,205,196,0.15)",  border: "var(--toto)",           icon: "⏳", label: "समझ रहे हैं…", color: "var(--toto)"         },
    success:    { bg: "rgba(0,200,150,0.2)",    border: "var(--success)",        icon: "✅", label: "शाबाश!",        color: "var(--success)"      },
    error:      { bg: "rgba(255,107,107,0.15)", border: "var(--warn)",           icon: "🔄", label: "फिर बोलो…",    color: "var(--warn)"         },
  };
  const c = cfg[state];
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.button type="button" onClick={onTap} whileTap={{ scale: 0.88 }}
        className="relative rounded-full flex items-center justify-center"
        style={{ width: 80, height: 80, background: c.bg, border: `3px solid ${c.border}` }}>
        {(state === "listening" || state === "auto_start") && [0, 1, 2].map(i => (
          <motion.div key={i} className="absolute inset-0 rounded-full border-2"
            style={{ borderColor: "var(--magic)" }}
            animate={{ scale: [1, 2 + i * 0.4], opacity: [0.6, 0] }}
            transition={{ duration: 1.3, repeat: Infinity, delay: i * 0.4, ease: "easeOut" }} />
        ))}
        <span className="text-3xl relative z-10">{c.icon}</span>
      </motion.button>
      <span className="font-display font-bold text-sm" style={{ color: c.color }}>{c.label}</span>
    </div>
  );
}

function AnswerChips({ options, onPick }: { options: string[]; onPick: (opt: string) => void }) {
  const unique = Array.from(new Set(options.filter(Boolean)));
  if (unique.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 justify-center max-w-xs">
      {unique.map((opt) => (
        <motion.button
          key={opt}
          type="button"
          whileTap={{ scale: 0.92 }}
          onClick={() => onPick(opt)}
          className="px-5 py-2.5 rounded-2xl font-body font-bold akshar"
          style={{
            background: "rgba(255,248,237,0.92)",
            color: "var(--ink)",
            fontSize: "1.35rem",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
          }}
        >
          {opt}
        </motion.button>
      ))}
    </div>
  );
}

// ── Memory game ────────────────────────────────────────────
function MemoryGame({ accLetters, onComplete }: { accLetters: LetterCard[]; onComplete: () => void }) {
  const shuffled = useMemo(
    () => [...accLetters, ...accLetters]
      .map((l, i) => ({ ...l, uid: `${l.id}-${i}` }))
      .sort(() => Math.random() - 0.5),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<string[]>([]);
  const [preview, setPreview] = useState<string | null>(null);
  const [shaking, setShaking] = useState(false);
  const lockRef = useRef(false);

  const tap = (uid: string, id: string, glyph: string) => {
    if (lockRef.current || matched.includes(uid) || flipped.includes(uid)) return;
    const next = [...flipped, uid];
    setFlipped(next);
    setPreview(glyph);
    if (next.length === 2) {
      lockRef.current = true;
      const [a, b] = next.map(u => shuffled.find(c => c.uid === u)!);
      if (a.id === b.id) {
        const newMatched = [...matched, ...next];
        setMatched(newMatched);
        setFlipped([]);
        setPreview(null);
        lockRef.current = false;
        if (newMatched.length === shuffled.length) setTimeout(onComplete, 600);
      } else {
        setShaking(true);
        setTimeout(() => {
          setFlipped([]);
          setPreview(null);
          setShaking(false);
          lockRef.current = false;
        }, 900);
      }
    }
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <motion.div
        className="w-20 h-20 rounded-3xl flex items-center justify-center akshar font-bold"
        style={{
          background: preview ? "rgba(124,92,191,0.25)" : "rgba(255,248,237,0.06)",
          border: `2.5px solid ${preview ? "var(--magic)" : "rgba(255,248,237,0.1)"}`,
          fontSize: "3rem", color: "var(--surface)",
        }}
        animate={shaking ? { x: [-8, 8, -8, 8, 0] } : {}}
        transition={{ duration: 0.4 }}>
        {preview ?? ""}
      </motion.div>

      <div className="grid grid-cols-4 gap-2 w-full max-w-xs">
        {shuffled.map((c) => {
          const isFlipped = flipped.includes(c.uid) || matched.includes(c.uid);
          const isMatched = matched.includes(c.uid);
          return (
            <motion.button key={c.uid} type="button"
              onClick={() => tap(c.uid, c.id, c.glyph)}
              whileTap={!isFlipped ? { scale: 0.88 } : {}}
              className="aspect-square rounded-2xl flex items-center justify-center"
              style={{
                background: isMatched ? "rgba(0,200,150,0.2)" : isFlipped ? "rgba(255,200,74,0.15)" : "rgba(255,248,237,0.08)",
                border: `2px solid ${isMatched ? "var(--success)" : isFlipped ? "var(--firefly)" : "rgba(255,248,237,0.15)"}`,
                minHeight: 64,
              }}>
              <AnimatePresence mode="wait">
                {isFlipped
                  ? <motion.span key="front" initial={{ rotateY: 90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }}
                      className="akshar font-bold"
                      style={{ fontSize: "2rem", color: isMatched ? "var(--success)" : "var(--surface)" }}>
                      {c.glyph}
                    </motion.span>
                  : <motion.span key="back" initial={{ rotateY: -90, opacity: 0 }} animate={{ rotateY: 0, opacity: 1 }}
                      style={{ fontSize: "1.5rem" }}>⭐</motion.span>
                }
              </AnimatePresence>
            </motion.button>
          );
        })}
      </div>

      <p className="font-body text-xs text-center" style={{ color: "rgba(255,248,237,0.4)" }}>
        एक जैसे अक्षर ढूँढकर टैप करें
      </p>
    </div>
  );
}

// ── Sound combo game ───────────────────────────────────────
function SoundComboGame({ letters, onComplete }: { letters: LetterCard[]; onComplete: () => void }) {
  const n = letters.length;
  const required = Math.min(n * n, 8);
  const cellSize = Math.min(60, Math.floor(252 / n));
  const headerSz = Math.floor(cellSize * 0.65);

  const [selected,  setSelected]  = useState<string | null>(null);
  const [discovered, setDiscovered] = useState<Set<string>>(new Set());
  const [justAdded, setJustAdded] = useState<string | null>(null);

  const handleLetterTap = (id: string) => {
    if (!selected) { setSelected(id); return; }
    const key = `${selected}+${id}`;
    if (!discovered.has(key)) {
      const next = new Set(discovered);
      next.add(key);
      setDiscovered(next);
      setJustAdded(key);
      setTimeout(() => setJustAdded(null), 600);
      if (next.size >= required) setTimeout(onComplete, 800);
    }
    setSelected(null);
  };

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="flex items-center gap-2">
        <span className="font-display font-bold text-lg" style={{ color: "var(--firefly)" }}>{discovered.size}</span>
        <span className="font-body text-xs" style={{ color: "rgba(255,248,237,0.4)" }}>/ {required} मिलाए</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: `${headerSz}px repeat(${n}, ${cellSize}px)`, gap: 3 }}>
        <div style={{ width: headerSz, height: headerSz }} />
        {letters.map(l => (
          <div key={`ch-${l.id}`} className="flex items-center justify-center akshar font-bold rounded-lg"
            style={{ width: cellSize, height: headerSz, fontSize: `${Math.max(0.8, cellSize / 50)}rem`,
              color: selected === l.id ? "var(--firefly)" : "rgba(255,248,237,0.6)",
              background: selected === l.id ? "rgba(255,200,74,0.15)" : "transparent" }}>
            {l.glyph}
          </div>
        ))}
        {letters.map(rowL => (
          <React.Fragment key={`row-${rowL.id}`}>
            <div className="flex items-center justify-center akshar font-bold rounded-lg"
              style={{ width: headerSz, height: cellSize, fontSize: `${Math.max(0.8, cellSize / 50)}rem`,
                color: selected === rowL.id ? "var(--firefly)" : "rgba(255,248,237,0.6)",
                background: selected === rowL.id ? "rgba(255,200,74,0.15)" : "transparent" }}>
              {rowL.glyph}
            </div>
            {letters.map(colL => {
              const key = `${rowL.id}+${colL.id}`;
              const isDone = discovered.has(key);
              const isNew  = justAdded === key;
              return (
                <motion.div key={key}
                  className="rounded-xl flex items-center justify-center akshar font-bold"
                  style={{ width: cellSize, height: cellSize,
                    background: isNew ? "rgba(124,92,191,0.45)" : isDone ? "rgba(124,92,191,0.2)" : "rgba(255,248,237,0.05)",
                    border: `1.5px solid ${isNew ? "var(--magic)" : isDone ? "rgba(124,92,191,0.4)" : "rgba(255,248,237,0.1)"}`,
                    fontSize: `${Math.max(0.65, cellSize / 54)}rem`,
                    color: isDone ? "var(--surface)" : "transparent" }}
                  animate={isNew ? { scale: [1, 1.18, 1] } : {}}
                  transition={{ duration: 0.35 }}>
                  {isDone ? `${rowL.glyph}${colL.glyph}` : ""}
                </motion.div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 justify-center mt-1">
        {letters.map(l => (
          <motion.button key={l.id} type="button"
            onClick={() => handleLetterTap(l.id)}
            whileTap={{ scale: 0.88 }}
            className="rounded-2xl flex items-center justify-center akshar font-bold"
            style={{ width: 56, height: 56,
              background: selected === l.id ? "rgba(255,200,74,0.25)" : "rgba(124,92,191,0.2)",
              border: `2.5px solid ${selected === l.id ? "var(--firefly)" : "rgba(124,92,191,0.4)"}`,
              fontSize: "2rem", color: "var(--surface)" }}>
            {l.glyph}
          </motion.button>
        ))}
      </div>

      <p className="font-body text-xs text-center" style={{ color: "rgba(255,248,237,0.4)" }}>
        दो आवाज़ें टैप करके मिलाओ
      </p>
    </div>
  );
}

// ── MAIN ENGINE ───────────────────────────────────────────
export default function SceneEngine({ level, sublevelIndex, onComplete, onBack }: Props) {
  const { completeSublevel, markExerciseDone } = useProgress();

  const sublevel = level.sublevels[sublevelIndex];
  const obj1     = sublevel.objects[0];
  const obj2     = sublevel.objects[1];
  const letter1  = sublevel.letters[0];
  const letter2  = sublevel.letters[1];
  const word     = sublevel.word;

  const accLetters = useMemo(() => {
    const seen = new Set<string>();
    const result: LetterCard[] = [];
    for (let i = 0; i <= sublevelIndex && result.length < 6; i++) {
      for (const l of level.sublevels[i].letters) {
        if (!seen.has(l.id)) { seen.add(l.id); result.push(l); }
      }
    }
    return result;
  }, [level, sublevelIndex]);

  const { isListening, isSupported, isProcessing, transcript, error: speechErr, startListening, stopListening } = useSpeechRecognition();
  const { narrate, stop: stopNarration } = useNarration();
  const { stopAll, isPlaying } = useAudio();

  const [sceneIdx,     setSceneIdx]     = useState(0);
  const [sceneState,   setSceneState]   = useState<SceneState>("intro");
  const [feedbackText, setFeedbackText] = useState("");
  const [restoreLevel, setRestoreLevel] = useState(sublevelIndex);
  const [micState,     setMicState]     = useState<MicState>("idle");

  const sceneStateRef   = useRef<SceneState>("intro");
  const sceneIdxRef     = useRef(0);
  const answeringRef    = useRef(false);
  const isPlayingRef    = useRef(false);
  const armTimeoutRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isListeningRef  = useRef(false);

  sceneStateRef.current = sceneState;
  sceneIdxRef.current   = sceneIdx;
  isPlayingRef.current  = isPlaying;
  isListeningRef.current = isListening;

  const sceneType   = SCENE_ORDER[sceneIdx];
  const bgStyle     = FOREST_BG[Math.min(restoreLevel, FOREST_BG.length - 1)];
  const totalScenes = SCENE_ORDER.length;

  useEffect(() => {
    if (isListening) {
      setSceneState("listening");
      setMicState("listening");
      return;
    }
    if (isProcessing) {
      setMicState("processing");
    }
  }, [isListening, isProcessing]);

  const handleCorrectRef = useRef<() => void>(() => {});
  const handleWrongRef   = useRef<() => void>(() => {});
  const voiceTriggerRef  = useRef<() => void>(() => {});

  const getExpectedAnswers = useCallback((): string[] => {
    switch (sceneType) {
      case "name_object":  return [obj1.nameHi];
      case "first_sound":  return [letter1.glyph, letter1.soundHi];
      case "name_object2": return [obj2.nameHi];
      case "first_sound2": return [letter2.glyph, letter2.soundHi];
      case "blend":        return [word.glyph, word.roman];
      default:             return [];
    }
  }, [sceneType, obj1, obj2, letter1, letter2, word]);

  const getTapOptions = useCallback((): string[] => {
    switch (sceneType) {
      case "name_object":  return [obj1.nameHi];
      case "name_object2": return [obj2.nameHi];
      case "first_sound":  return [letter1.glyph, letter2.glyph];
      case "first_sound2": return [letter2.glyph, letter1.glyph];
      case "blend":        return [word.glyph, letter1.glyph, letter2.glyph];
      default:             return [];
    }
  }, [sceneType, obj1, obj2, letter1, letter2, word]);

  const getSceneData = useCallback((): {
    speakerHi: string; questionHi: string; speakerChar: "tina" | "toto"; answerHi: string;
  } => {
    switch (sceneType) {
      case "name_object":
        return { speakerChar: "tina", speakerHi: "टीना", questionHi: "अरे Toto, ये क्या है?", answerHi: obj1.nameHi };
      case "first_sound":
        return { speakerChar: "toto", speakerHi: "टोटो", questionHi: `${obj1.nameHi} की पहली आवाज़ क्या है?`, answerHi: letter1.glyph };
      case "name_object2":
        return { speakerChar: "tina", speakerHi: "टीना", questionHi: "ये क्या है?", answerHi: obj2.nameHi };
      case "first_sound2":
        return { speakerChar: "toto", speakerHi: "टोटो", questionHi: `${obj2.nameHi} की पहली आवाज़ क्या है?`, answerHi: letter2.glyph };
      case "blend":
        return { speakerChar: "tina", speakerHi: "टीना", questionHi: "इन दोनों आवाज़ों को जोड़कर क्या बनेगा?", answerHi: word.glyph };
      case "memory":
        return { speakerChar: "toto", speakerHi: "टोटो", questionHi: "एक जैसे अक्षर ढूँढो और मिलाओ", answerHi: "" };
      case "word_build":
        return { speakerChar: "tina", speakerHi: "टीना", questionHi: "अब आवाज़ें मिलाकर नए शब्द बनाओ!", answerHi: "" };
    }
  }, [sceneType, obj1, obj2, letter1, letter2, word]);

  const scene  = getSceneData();
  const isTina = scene.speakerChar === "tina";

  const handleCorrect = useCallback(() => {
    if (sceneStateRef.current === "correct") return;
    answeringRef.current = true;
    stopListening();
    stopNarration();

    const PRAISES = ["शाबाश! 🌟", "बहुत बढ़िया! ✨", "कमाल! 🎉", "बिल्कुल सही! 💫", "वाह! 🌈"];
    const praiseText = PRAISES[Math.floor(Math.random() * PRAISES.length)];
    setFeedbackText(praiseText);
    setSceneState("correct");
    setRestoreLevel(r => Math.min(r + 1, FOREST_BG.length - 1));
    setMicState("success");
    const listener: SpeakerCharacter = scene.speakerChar === "tina" ? "toto" : "tina";
    narrate(pickPraiseAudioId(listener), praiseText, listener);
    markExerciseDone(sublevelIndex, sceneIdx + 1).catch(() => {});
    setTimeout(() => {
      setMicState("idle");
      if (sceneIdx >= totalScenes - 1) {
        completeSublevel(sublevelIndex).catch(() => {});
        setTimeout(() => onComplete(sublevelIndex), 600);
      } else {
        setSceneIdx(i => i + 1);
      }
    }, 1800);
  }, [sceneIdx, totalScenes, sublevelIndex, markExerciseDone, completeSublevel, onComplete, scene.speakerChar, narrate, stopListening, stopNarration]);

  const clearArmTimers = useCallback(() => {
    if (armTimeoutRef.current) { clearTimeout(armTimeoutRef.current); armTimeoutRef.current = null; }
  }, []);

  const waitForSilenceThen = useCallback((fn: () => void, attempt = 0) => {
    if (attempt > 25) { fn(); return; }
    if (isPlayingRef.current) {
      armTimeoutRef.current = setTimeout(() => {
        armTimeoutRef.current = null;
        waitForSilenceThen(fn, attempt + 1);
      }, 100);
      return;
    }
    fn();
  }, []);

  const scheduleArmMic = useCallback((delayMs: number) => {
    clearArmTimers();
    armTimeoutRef.current = setTimeout(() => {
      armTimeoutRef.current = null;
      waitForSilenceThen(() => voiceTriggerRef.current());
    }, delayMs);
  }, [clearArmTimers, waitForSilenceThen]);

  const handleWrong = useCallback(() => {
    if (sceneStateRef.current === "correct" || sceneStateRef.current === "wrong") return;
    stopListening();
    stopNarration();
    stopAll();

    const RETRIES = ["फिर से कोशिश करो 💪", "हिम्मत रखो!", "एक बार और सोचो", "बहुत करीब हो!"];
    const retryText = RETRIES[Math.floor(Math.random() * RETRIES.length)];
    setFeedbackText(retryText);
    setSceneState("wrong");
    setMicState("error");
    const listener: SpeakerCharacter = scene.speakerChar === "tina" ? "toto" : "tina";
    narrate(pickRetryAudioId(listener), retryText, listener, () => {
      if (sceneStateRef.current !== "wrong") return;
      answeringRef.current = false;
      setSceneState("intro");
      setFeedbackText("");
      setMicState("auto_start");
      scheduleArmMic(1000);
    });
  }, [scene.speakerChar, narrate, stopListening, stopNarration, stopAll, scheduleArmMic]);

  const handleTapAnswer = useCallback((picked: string) => {
    if (sceneStateRef.current === "correct") return;
    answeringRef.current = true;
    clearArmTimers();
    stopListening();
    stopNarration();
    const expected = getExpectedAnswers();
    const norm = (s: string) => s.trim();
    const matched = expected.some(
      (e) => norm(picked) === norm(e) || norm(picked).includes(norm(e)) || norm(e).includes(norm(picked)),
    );
    if (matched) handleCorrectRef.current();
    else handleWrongRef.current();
  }, [getExpectedAnswers, stopListening, stopNarration, clearArmTimers]);

  // Assign latest closures to refs every render so effects/timeouts never go stale
  handleCorrectRef.current = handleCorrect;
  handleWrongRef.current   = handleWrong;
  voiceTriggerRef.current  = () => {
    if (sceneStateRef.current === "correct") return;
    if (isListeningRef.current) return;

    clearArmTimers();
    stopNarration();
    stopAll();

    const capturedScene = sceneIdxRef.current;
    const answers = getExpectedAnswers();
    const exerciseId = `level-${sublevelIndex}-scene-${sceneIdxRef.current}`;

    answeringRef.current = false;
    setMicState("auto_start");

    waitForSilenceThen(() => {
      if (sceneIdxRef.current !== capturedScene) return;

      startListening(answers, (matched, text) => {
        if (sceneIdxRef.current !== capturedScene) return;
        if (answeringRef.current) return;

        if (!text && !matched) {
          setSceneState("intro");
          setMicState("idle");
          return;
        }

        answeringRef.current = true;
        stopListening();
        if (matched) handleCorrectRef.current();
        else handleWrongRef.current();
      }, exerciseId);
    });
  };

  // Narrate prompt on each scene, then auto-arm mic for voice scenes
  useEffect(() => {
    answeringRef.current = false;
    clearArmTimers();
    setSceneState("intro");
    setMicState("idle");
    stopListening();
    stopNarration();
    stopAll();
    setFeedbackText("");

    const type = SCENE_ORDER[sceneIdx];
    const capturedScene = sceneIdx;
    const data = getSceneData();
    const kind = sceneToPromptKind(type);
    const audioId = getScenePromptAudioId(kind, data.speakerChar);

    narrate(audioId, data.questionHi, data.speakerChar, () => {
      if (sceneIdxRef.current !== capturedScene) return;
      if (!VOICE_SCENES.has(type)) return;
      stopAll();
      setMicState("auto_start");
      scheduleArmMic(600);
    });

    return () => {
      clearArmTimers();
      stopListening();
      stopNarration();
      stopAll();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sceneIdx]);

  const handleMicTap = () => {
    if (isListening) {
      stopListening();
      setSceneState("intro");
      setMicState("idle");
      return;
    }
    answeringRef.current = false;
    clearArmTimers();
    stopNarration();
    stopAll();

    const capturedScene = sceneIdx;
    const answers = getExpectedAnswers();
    const exerciseId = `level-${sublevelIndex}-scene-${capturedScene}`;

    setMicState("auto_start");

    startListening(answers, (matched, text) => {
      if (sceneIdxRef.current !== capturedScene) return;
      if (answeringRef.current) return;

      if (!text && !matched) {
        setSceneState("intro");
        setMicState("idle");
        return;
      }

      answeringRef.current = true;
      stopListening();
      if (matched) handleCorrectRef.current();
      else handleWrongRef.current();
    }, exerciseId);
  };

  return (
    <div className="relative flex flex-col h-full overflow-hidden" style={{ background: bgStyle }}>

      {/* Fireflies */}
      {[{x:8,y:20,s:3},{x:82,y:15,s:4},{x:50,y:55,s:3},{x:20,y:78,s:4},{x:90,y:45,s:3}].map((p, i) => (
        <motion.div key={i} className="absolute rounded-full pointer-events-none"
          style={{ left:`${p.x}%`, top:`${p.y}%`, width:p.s, height:p.s,
            background:"var(--firefly)", boxShadow:`0 0 ${p.s*3}px var(--firefly-glow)` }}
          animate={{ y:[0,-15,0], opacity:[0.2,0.7,0.2] }}
          transition={{ duration:4+i, repeat:Infinity, delay:i*0.7 }} />
      ))}

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-3 pt-3 pb-1">
        <button type="button" onClick={onBack}
          className="w-10 h-10 rounded-full flex items-center justify-center min-h-0"
          style={{ background:"rgba(255,248,237,0.06)", border:"1px solid rgba(255,248,237,0.1)" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
        </button>
        <div className="flex gap-1.5 items-center">
          {SCENE_ORDER.map((_, i) => (
            <motion.div key={i}
              animate={{ width: i===sceneIdx?22:8, background: i<sceneIdx?"var(--success)":i===sceneIdx?"var(--firefly)":"rgba(255,248,237,0.2)" }}
              transition={{ type:"spring", stiffness:280, damping:26 }}
              className="h-2 rounded-full" />
          ))}
        </div>
        <div className="px-2 py-1 rounded-xl font-body text-xs"
          style={{ background:"rgba(255,248,237,0.08)", color:"rgba(255,248,237,0.5)" }}>
          {sublevelIndex+1}/{level.sublevels.length}
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-between px-4 py-3 gap-3 overflow-y-auto">

        {/* Character prompt */}
        <div className="flex items-end gap-3 w-full">
          <motion.div animate={{ opacity: 0.35, scale: 0.78 }} className="shrink-0">
            <img src={isTina ? "/characters/Toto_transparent.png" : "/characters/Tina_transparent.png"}
              alt="" className="object-contain object-bottom"
              style={{ width:44, height:62, transform: isTina ? "scaleX(-1)" : undefined }}
              draggable={false} />
          </motion.div>

          <AnimatePresence mode="wait">
            <motion.div key={`q-${sceneIdx}-${sceneState}`}
              initial={{ opacity:0, y:8, scale:0.93 }} animate={{ opacity:1, y:0, scale:1 }} exit={{ opacity:0 }}
              transition={{ duration:0.22 }}
              className="flex-1 px-4 py-3 rounded-2xl"
              style={{
                background: sceneState==="correct" ? "rgba(0,200,150,0.12)" : sceneState==="wrong" ? "rgba(255,107,107,0.08)" : "rgba(255,248,237,0.95)",
                border: sceneState==="correct" ? "1.5px solid var(--success)" : sceneState==="wrong" ? "1.5px solid var(--warn)" : "none",
                boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
              }}>
              <p className="font-body font-semibold text-center leading-deva"
                style={{ fontSize:"clamp(0.85rem,4vw,0.98rem)",
                  color: sceneState==="correct" ? "var(--success)" : sceneState==="wrong" ? "var(--warn)" : "var(--ink)" }}>
                {sceneState==="correct" || sceneState==="wrong" ? feedbackText : scene.questionHi}
              </p>
            </motion.div>
          </AnimatePresence>

          <motion.div className="shrink-0">
            <motion.img
              src={isTina ? "/characters/Tina_transparent.png" : "/characters/Toto_transparent.png"}
              alt={scene.speakerHi}
              animate={{ y: sceneState==="intro" ? [0,-5,0] : 0, rotate: isTina ? [0,-2,2,0] : [0,2,-2,0] }}
              transition={{ duration:1.8, repeat:Infinity, ease:"easeInOut" }}
              className="object-contain object-bottom"
              style={{ width:52, height:72,
                transform: !isTina ? "scaleX(-1)" : undefined,
                filter:`drop-shadow(0 0 12px ${isTina?"var(--tina)":"var(--toto)"})` }}
              draggable={false} />
          </motion.div>
        </div>

        {/* Scene-specific display */}
        <AnimatePresence mode="wait">
          <motion.div key={`display-${sceneIdx}`}
            initial={{ opacity:0, scale:0.85 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:0.85 }}
            transition={{ duration:0.3, ease:[0.16,1,0.3,1] }}
            className="flex flex-col items-center gap-4 flex-1 justify-center">

            {(sceneType==="name_object" || sceneType==="first_sound") && (
              <ObjectDisplay
                src={obj1.image}
                nameHi={obj1.nameHi}
                large
                onTap={sceneType === "name_object" ? () => handleTapAnswer(obj1.nameHi) : undefined}
              />
            )}
            {(sceneType==="name_object2" || sceneType==="first_sound2") && (
              <ObjectDisplay
                src={obj2.image}
                nameHi={obj2.nameHi}
                large
                onTap={sceneType === "name_object2" ? () => handleTapAnswer(obj2.nameHi) : undefined}
              />
            )}

            {sceneType === "blend" && (
              <div className="flex items-center gap-3">
                {[letter1.glyph, "+", letter2.glyph, "=", "?"].map((item, i) => (
                  <motion.div key={i}
                    initial={{ scale:0, opacity:0 }} animate={{ scale:1, opacity:1 }}
                    transition={{ delay:i*0.12, type:"spring", stiffness:300, damping:18 }}
                    className={item==="+"||item==="="||item==="?" ? "font-display font-bold" : "w-20 h-20 rounded-2xl flex items-center justify-center akshar font-bold"}
                    style={item==="+"||item==="="||item==="?"
                      ? { color:"var(--firefly)", fontSize:"2rem" }
                      : { background:"rgba(124,92,191,0.2)", border:"2px solid rgba(124,92,191,0.4)", fontSize:"3rem", color:"var(--surface)" }}>
                    {item}
                  </motion.div>
                ))}
              </div>
            )}

            {sceneType === "memory" && (
              <MemoryGame accLetters={accLetters} onComplete={handleCorrect} />
            )}

            {sceneType === "word_build" && (
              <SoundComboGame letters={accLetters} onComplete={handleCorrect} />
            )}

          </motion.div>
        </AnimatePresence>

        {/* Mic button — voice scenes only */}
        {VOICE_SCENES.has(sceneType) && sceneState !== "correct" && (
          <div className="flex flex-col items-center gap-3 pb-2">
            <BigMicButton state={micState} onTap={handleMicTap} />
            {transcript && isListening && (
              <p className="font-body text-xs text-center px-4 akshar" style={{ color: "rgba(255,248,237,0.7)" }}>
                सुना: {transcript}
              </p>
            )}
            {speechErr && (
              <p className="font-body text-xs text-center px-4" style={{ color: "var(--warn)" }}>
                {speechErr}
              </p>
            )}
            {!isSupported && (
              <p className="font-body text-xs text-center px-4" style={{ color: "rgba(255,248,237,0.55)" }}>
                माइक काम नहीं कर रहा — नीचे टैप करो
              </p>
            )}
            <p className="font-body text-xs" style={{ color: "rgba(255,248,237,0.45)" }}>या टैप करो</p>
            <AnswerChips options={getTapOptions()} onPick={handleTapAnswer} />
          </div>
        )}

      </main>
    </div>
  );
}
