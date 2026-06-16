"use client";

// AppProviders — client-side context stack.
// ProgressProvider receives the levelId from the current URL so it loads
// the correct level's progress without any hardcoded level references.

import React, { useMemo } from "react";
import { usePathname } from "next/navigation";
import { AuthProvider }     from "@/contexts/AuthContext";
import { AudioProvider }    from "@/contexts/AudioContext";
import { SpeakerProvider }  from "@/contexts/SpeakerContext";
import { ProgressProvider } from "@/contexts/ProgressContext";
import { DEFAULT_LEVEL_ID } from "@/lib/content/registry";
import AudioUnlockGate      from "@/components/audio/AudioUnlockGate";

// Extract levelId from pathname: /level/level-1/... → "level-1"
function useLevelIdFromPath(): string {
  const pathname = usePathname() ?? "";
  const match    = pathname.match(/\/level\/([^/]+)/);
  return match?.[1] ?? DEFAULT_LEVEL_ID;
}

export default function AppProviders({ children }: { children: React.ReactNode }) {
  const levelId = useLevelIdFromPath();

  return (
    <AuthProvider>
      <AudioProvider>
        <SpeakerProvider>
          <ProgressProvider levelId={levelId}>
            <AudioUnlockGate />
            {children}
          </ProgressProvider>
        </SpeakerProvider>
      </AudioProvider>
    </AuthProvider>
  );
}
