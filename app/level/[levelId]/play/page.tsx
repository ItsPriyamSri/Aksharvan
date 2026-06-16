"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion } from "framer-motion";
import { useRouteGuard }   from "@/hooks/useRouteGuard";
import { useProgress }     from "@/contexts/ProgressContext";
import { getLevel, DEFAULT_LEVEL_ID } from "@/lib/content/registry";
import SceneEngine         from "@/components/exercise/SceneEngine";
import LoadingScreen       from "@/components/ui/LoadingScreen";

function RestorationTransition({ from, to, onDone }: { from: number; to: number; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 4500);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <img src={`/scenes/${from}.jpeg`} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <motion.img
        src={`/scenes/${to}.jpeg`}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 4, ease: "easeInOut", delay: 0.5 }}
      />
    </div>
  );
}

export default function PlayPage() {
  const params             = useParams<{ levelId: string }>();
  const router             = useRouter();
  const { isChecking }     = useRouteGuard({ mode: "require-auth" });
  const { progress, isLoading, getActiveSublevelIndex } = useProgress();

  const levelId = params?.levelId ?? DEFAULT_LEVEL_ID;
  const level   = getLevel(levelId);

  const [restoring, setRestoring] = useState<{ from: number; to: number; isLast: boolean } | null>(null);

  useEffect(() => {
    if (!level) router.replace("/map");
  }, [level, router]);

  const handleSubLevelComplete = useCallback((completedIdx: number) => {
    if (!level) return;
    const nextIndex = completedIdx + 1;
    const isLast = nextIndex >= level.sublevels.length;
    setRestoring({ from: completedIdx + 1, to: completedIdx + 2, isLast });
  }, [level]);

  const handleRestorationDone = useCallback(() => {
    if (!restoring) return;
    setRestoring(null);
    if (restoring.isLast) {
      router.push(`/level/${levelId}/complete`);
    }
  }, [restoring, router, levelId]);

  const handleBack = useCallback(() => router.push("/map"), [router]);

  if (!level || isChecking || isLoading) return <LoadingScreen />;

  if (restoring) {
    return (
      <div className="h-dvh screen-safe">
        <RestorationTransition from={restoring.from} to={restoring.to} onDone={handleRestorationDone} />
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
