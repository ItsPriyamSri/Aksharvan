"use client";

import { useCallback, useRef } from "react";
import { useAudio } from "@/contexts/AudioContext";
import { SARVAM_BROWSER_TTS } from "@/lib/content/sarvam-voices";
import type { SpeakerCharacter } from "@/types/audio";

function speakWithBrowserTts(
  text: string,
  speaker: SpeakerCharacter,
  onEnd?: () => void,
): () => void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onEnd?.();
    return () => {};
  }

  const tuning = SARVAM_BROWSER_TTS[speaker];

  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "hi-IN";
  utter.rate = tuning.rate;
  utter.pitch = tuning.pitch;

  const voices = window.speechSynthesis.getVoices();
  const hindi = voices.find((v) => v.lang.startsWith("hi"));
  if (hindi) utter.voice = hindi;

  utter.onend = () => onEnd?.();
  utter.onerror = () => onEnd?.();
  window.speechSynthesis.speak(utter);

  return () => window.speechSynthesis.cancel();
}

async function clipExists(audioId: string): Promise<boolean> {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const project = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  if (!endpoint || !project || !audioId) return false;
  try {
    const r = await fetch(
      `${endpoint}/storage/buckets/audio/files/${audioId}/view?project=${project}`,
      { method: "HEAD" },
    );
    return r.ok;
  } catch {
    return false;
  }
}

/** Play Sarvam-generated clip from Appwrite; browser TTS only if clip missing. */
export function useNarration() {
  const { playClip, stopAll, audioUnlocked } = useAudio();
  const stopRef = useRef<(() => void) | null>(null);

  const stop = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    stopAll();
    if (typeof window !== "undefined") window.speechSynthesis?.cancel();
  }, [stopAll]);

  const narrate = useCallback(
    (
      audioId: string,
      textHi: string,
      speaker: SpeakerCharacter,
      onEnd?: () => void,
    ): void => {
      stop();

      const fallback = () => {
        stopRef.current = speakWithBrowserTts(textHi, speaker, onEnd);
      };

      void (async () => {
        if (!audioUnlocked || !(await clipExists(audioId))) {
          fallback();
          return;
        }

        stopRef.current = playClip(
          audioId,
          onEnd,
          () => {
            fallback();
          },
        );
      })();
    },
    [audioUnlocked, playClip, stop],
  );

  return { narrate, stop };
}
