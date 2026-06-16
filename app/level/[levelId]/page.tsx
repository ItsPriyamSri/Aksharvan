"use client";

import React, { useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useRouteGuard }    from "@/hooks/useRouteGuard";
import { DEFAULT_LEVEL_ID } from "@/lib/content/registry";
import LevelEntryScreen     from "@/components/cutscene/LevelEntryScreen";
import ShotSequencePlayer   from "@/components/cutscene/ShotSequencePlayer";
import { getLevelCutscene } from "@/lib/content/cutscenes";
import LoadingScreen        from "@/components/ui/LoadingScreen";

const LEVEL_ENTRY: Record<string, { imageSrc: string; captionHi: string }> = {
  "level-1": {
    imageSrc: "/scenes/1.jpeg",
    captionHi: "जंगल को बचाने के लिए चलो सीखते हैं!",
  },
};

export default function LevelCutscenePage() {
  const params         = useParams<{ levelId: string }>();
  const router         = useRouter();
  const { isChecking } = useRouteGuard({ mode: "require-auth" });

  const levelId = params?.levelId ?? DEFAULT_LEVEL_ID;
  const entry   = LEVEL_ENTRY[levelId];

  const handleComplete = useCallback(() => {
    router.replace(`/level/${levelId}/play`);
  }, [levelId, router]);

  if (isChecking) return <LoadingScreen />;

  if (entry) {
    return <LevelEntryScreen imageSrc={entry.imageSrc} captionHi={entry.captionHi} onComplete={handleComplete} />;
  }

  const shots = getLevelCutscene(levelId);
  return <ShotSequencePlayer shots={shots} onComplete={handleComplete} skipLabel="सीधे खेलें" />;
}
