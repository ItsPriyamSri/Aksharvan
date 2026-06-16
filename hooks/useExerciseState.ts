"use client";

// useExerciseState — state machine for a single sub-level's 7 exercises.
// ALfA pedagogy: wrong = retry, no reveal. Correct = praise + advance.
// Mini-games (match_build, memory) call advance() directly via onSuccess.

import { useState, useCallback, useRef, useEffect } from "react";
import type { Exercise, FeedbackStrings } from "@/types/content";
import { useAudio }    from "@/contexts/AudioContext";
import { useSpeaker }  from "@/contexts/SpeakerContext";
import { useProgress } from "@/contexts/ProgressContext";

export type ExercisePhase =
  | "idle"
  | "prompting"
  | "answering"
  | "feedback_correct"
  | "feedback_retry"
  | "advancing"
  | "complete";

export type ExerciseStateResult = {
  phase:            ExercisePhase;
  currentIndex:     number;
  totalExercises:   number;
  missCount:        number;
  selectedOptionId: string | null;
  feedbackText:     string;
  submitAnswer:     (optionId: string, correctId: string) => void;
  advance:          () => void;
  onNarrationEnd:   () => void;
};

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const MINI_GAME_TYPES = new Set(["match_build", "memory"]);

export function useExerciseState(
  exercises: Exercise[],
  feedback: FeedbackStrings,
  sublevelIndex: number,
): ExerciseStateResult {
  const { isMockMode, playClip, stopAll } = useAudio();
  const { advanceSpeaker }                = useSpeaker();
  const { markExerciseDone, completeSublevel } = useProgress();

  const total = exercises.length;

  const [currentIndex,     setCurrentIndex]     = useState(0);
  const [phase,            setPhase]            = useState<ExercisePhase>("idle");
  const [missCount,        setMissCount]        = useState(0);
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [feedbackText,     setFeedbackText]     = useState("");

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = () => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
  };

  // ── Start a prompt ─────────────────────────────────────────────────────────

  const startPrompt = useCallback((index: number) => {
    const ex = exercises[index];
    if (!ex) return;

    setPhase("prompting");
    setSelectedOptionId(null);
    setMissCount(0);
    setFeedbackText("");

    // Mini-games go straight to answering — they manage their own UI
    if (MINI_GAME_TYPES.has(ex.type) || isMockMode || !ex.promptAudio) {
      setPhase("answering");
      return;
    }

    playClip(ex.promptAudio, () => setPhase("answering"));
  }, [exercises, isMockMode, playClip]);

  // Start first exercise on mount
  useEffect(() => {
    startPrompt(0);
    return () => { clearTimer(); stopAll(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onNarrationEnd = useCallback(() => {
    if (phase === "prompting") setPhase("answering");
  }, [phase]);

  // ── Move to next exercise ──────────────────────────────────────────────────

  const moveToNext = useCallback((fromIndex: number) => {
    clearTimer();
    const nextIndex = fromIndex + 1;
    if (nextIndex >= total) {
      setPhase("complete");
      completeSublevel(sublevelIndex).catch(console.error);
      return;
    }
    setPhase("advancing");
    setCurrentIndex(nextIndex);
    timerRef.current = setTimeout(() => startPrompt(nextIndex), 300);
  }, [total, sublevelIndex, completeSublevel, startPrompt]);

  // ── Submit answer (tap exercises only) ────────────────────────────────────

  const submitAnswer = useCallback((optionId: string, correctId: string) => {
    if (phase !== "answering") return;
    setSelectedOptionId(optionId);
    stopAll();

    const isCorrect = optionId === correctId;

    if (isCorrect) {
      const praise = pickRandom(feedback.correct);
      setFeedbackText(praise);
      setPhase("feedback_correct");
      advanceSpeaker();
      markExerciseDone(sublevelIndex, currentIndex + 1).catch(console.error);

      // Auto-advance after brief pause if audio connected
      if (!isMockMode) {
        timerRef.current = setTimeout(() => moveToNext(currentIndex), 1400);
      }
    } else {
      const retry = pickRandom(feedback.retry);
      setFeedbackText(retry);
      setMissCount((c) => c + 1);
      setPhase("feedback_retry");

      if (!isMockMode) {
        timerRef.current = setTimeout(() => {
          setPhase("answering");
          setSelectedOptionId(null);
        }, 1600);
      }
    }
  }, [phase, currentIndex, feedback, isMockMode, advanceSpeaker, markExerciseDone, sublevelIndex, stopAll, moveToNext]);

  // ── Manual advance (mock mode + retry + mini-games) ───────────────────────

  const advance = useCallback(() => {
    clearTimer();

    if (phase === "feedback_correct" || phase === "advancing") {
      moveToNext(currentIndex);
      return;
    }
    if (phase === "feedback_retry") {
      setPhase("answering");
      setSelectedOptionId(null);
      return;
    }
    if (phase === "prompting") {
      setPhase("answering");
      return;
    }
    // Mini-game success: directly advance
    if (phase === "answering") {
      const ex = exercises[currentIndex];
      if (MINI_GAME_TYPES.has(ex?.type ?? "")) {
        markExerciseDone(sublevelIndex, currentIndex + 1).catch(console.error);
        advanceSpeaker();
        moveToNext(currentIndex);
      }
    }
  }, [phase, currentIndex, exercises, sublevelIndex, markExerciseDone, advanceSpeaker, moveToNext]);

  return {
    phase, currentIndex, totalExercises: total, missCount,
    selectedOptionId, feedbackText, submitAnswer, advance, onNarrationEnd,
  };
}
