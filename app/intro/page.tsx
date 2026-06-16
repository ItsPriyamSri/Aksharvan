"use client";

import React, { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useRouteGuard }  from "@/hooks/useRouteGuard";
import VideoCutscenePlayer from "@/components/cutscene/VideoCutscenePlayer";
import LoadingScreen       from "@/components/ui/LoadingScreen";

export default function IntroPage() {
  const router         = useRouter();
  const { isChecking } = useRouteGuard({ mode: "require-auth" });

  // After video → story intro screen (not directly to map)
  const handleComplete = useCallback(() => {
    router.replace("/story");
  }, [router]);

  if (isChecking) return <LoadingScreen />;

  return (
    <VideoCutscenePlayer
      src="/videos/story1.mp4"
      onComplete={handleComplete}
    />
  );
}
