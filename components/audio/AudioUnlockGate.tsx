"use client";

// Registers a one-time document click listener that unlocks the Howler
// AudioContext (required by mobile browsers before any audio can play).
// Renders no visible UI.

import { useEffect } from "react";
import { useAudio } from "@/contexts/AudioContext";
import { requestMicPermission } from "@/lib/speech/mic";

export default function AudioUnlockGate() {
  const { audioUnlocked, unlockAudio } = useAudio();

  useEffect(() => {
    if (audioUnlocked) return;

    const handleFirstGesture = () => {
      unlockAudio();
      void requestMicPermission();
      document.removeEventListener("click", handleFirstGesture);
      document.removeEventListener("touchstart", handleFirstGesture);
    };

    document.addEventListener("click", handleFirstGesture, { once: true });
    document.addEventListener("touchstart", handleFirstGesture, { once: true, passive: true });

    return () => {
      document.removeEventListener("click", handleFirstGesture);
      document.removeEventListener("touchstart", handleFirstGesture);
    };
  }, [audioUnlocked, unlockAudio]);

  return null;
}
