"use client";

import React from "react";
import { useRouteGuard } from "@/hooks/useRouteGuard";
import AksharvanMap      from "@/components/map/AksharvanMap";
import LoadingScreen     from "@/components/ui/LoadingScreen";

export default function MapPage() {
  const { isChecking } = useRouteGuard({ mode: "require-auth" });

  if (isChecking) return <LoadingScreen />;

  return (
    <div className="flex items-center justify-center h-dvh bg-black overflow-hidden">
      <div
        className="relative h-full overflow-hidden"
        style={{ width: "min(100vw, calc(100dvh * 9 / 16))" }}
      >
        <AksharvanMap />
      </div>
    </div>
  );
}
