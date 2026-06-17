"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useRouteGuard }   from "@/hooks/useRouteGuard";
import { useProgress }     from "@/contexts/ProgressContext";
import { getLevel, DEFAULT_LEVEL_ID } from "@/lib/content/registry";
import { getRestoreLine } from "@/lib/content/audio-resolver";
import { useNarration }    from "@/hooks/useNarration";
import { useAudio }        from "@/contexts/AudioContext";
import SceneEngine         from "@/components/exercise/SceneEngine";
import LoadingScreen       from "@/components/ui/LoadingScreen";

/** Crossfade 0.5s delay + 4s duration + 1.5s hold on the new scene. */
const RESTORE_VISUAL_MS = 6000;
/** Extra pause after visuals + narration before the next sublevel starts. */
const RESTORE_POST_HOLD_MS = 1200;

function RestorationTransition({
  from,
  to,
  completedSublevelIndex,
  onDone,
}: {
  from: number;
  to: number;
  completedSublevelIndex: number;
  onDone: () => void;
}) {
  const { narrate, stop } = useNarration();
  const { unlockAudio } = useAudio();
  const doneRef = useRef(false);
  const [visualDone, setVisualDone] = useState(false);
  const [audioDone, setAudioDone] = useState(false);

  const line = getRestoreLine(completedSublevelIndex);

  useEffect(() => {
    unlockAudio();
    doneRef.current = false;
    setVisualDone(false);
    setAudioDone(false);

    const visualTimer = setTimeout(() => setVisualDone(true), RESTORE_VISUAL_MS);
    const restoreLine = getRestoreLine(completedSublevelIndex);

    if (restoreLine) {
      narrate(restoreLine.audioId, restoreLine.textHi, "tina", () => setAudioDone(true));
    } else {
      setAudioDone(true);
    }

    return () => {
      clearTimeout(visualTimer);
      stop();
    };
  }, [completedSublevelIndex, narrate, stop, unlockAudio]);

  useEffect(() => {
    if (!visualDone || !audioDone || doneRef.current) return;
    doneRef.current = true;
    const t = setTimeout(onDone, RESTORE_POST_HOLD_MS);
    return () => clearTimeout(t);
  }, [visualDone, audioDone, onDone]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <img src={`/scenes/${from}.jpeg`} alt="" className="absolute inset-0 w-full h-full object-cover" draggable={false} />
      <motion.img
        src={`/scenes/${to}.jpeg`}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 4, ease: "easeInOut", delay: 0.5 }}
        draggable={false}
      />
      {line && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.45 }}
          className="absolute bottom-16 left-0 right-0 z-10 px-8 font-body font-semibold text-white text-center leading-deva"
          style={{
            fontSize: "clamp(1rem, 4.5vw, 1.2rem)",
            textShadow: "0 2px 12px rgba(0,0,0,0.85)",
          }}
        >
          {line.textHi}
        </motion.p>
      )}
    </div>
  );
}

export default function PlayPage() {
  const params             = useParams<{ levelId: string }>();
  const router             = useRouter();
  const { isChecking }     = useRouteGuard({ mode: "require-auth" });
  const { progress, isLoading, getActiveSublevelIndex, completeSublevel } = useProgress();

  const levelId = params?.levelId ?? DEFAULT_LEVEL_ID;
  const level   = getLevel(levelId);

  const [restoring, setRestoring] = useState<{
    from: number;
    to: number;
    isLast: boolean;
    completedSublevelIndex: number;
  } | null>(null);

  useEffect(() => {
    if (!level) router.replace("/map");
  }, [level, router]);

  const handleSubLevelComplete = useCallback((completedIdx: number) => {
    if (!level) return;
    const nextIndex = completedIdx + 1;
    const isLast = nextIndex >= level.sublevels.length;
    setRestoring({
      from: completedIdx + 1,
      to: completedIdx + 2,
      isLast,
      completedSublevelIndex: completedIdx,
    });
  }, [level]);

  const handleRestorationDone = useCallback(() => {
    if (!restoring) return;
    const { completedSublevelIndex, isLast } = restoring;
    completeSublevel(completedSublevelIndex).catch(() => {});
    setRestoring(null);
    if (isLast) {
      router.push(`/level/${levelId}/complete`);
    }
  }, [restoring, completeSublevel, router, levelId]);

  const handleBack = useCallback(() => router.push("/map"), [router]);

  if (!level || isChecking || isLoading) return <LoadingScreen />;

  if (restoring) {
    return (
      <div className="h-dvh screen-safe">
        <RestorationTransition
          from={restoring.from}
          to={restoring.to}
          completedSublevelIndex={restoring.completedSublevelIndex}
          onDone={handleRestorationDone}
        />
      </div>
    );
  }

  const allDone = progress?.sublevels.every(sl => sl.status === "completed");
  if (allDone) {
    router.replace(`/level/${levelId}/complete`);
    return <LoadingScreen />;
  }

  const activeSublevelIndex = getActiveSublevelIndex();

  return (
    <div className="h-dvh screen-safe">
      <SceneEngine
        key={activeSublevelIndex}
        level={level}
        sublevelIndex={activeSublevelIndex}
        onComplete={handleSubLevelComplete}
        onBack={handleBack}
      />
    </div>
  );
}
