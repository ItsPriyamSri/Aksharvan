"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// Click zones aligned to island landmasses in map.jpeg (percent of map container).
type Island = {
  id: string;
  name: string;
  locked: boolean;
  route?: string;
  zone: {
    top: string;
    left: string;
    width: string;
    height: string;
    borderRadius: string;
  };
};

const ISLANDS: Island[] = [
  {
    id: "level-1",
    name: "Magical Fairy Jungle",
    locked: false,
    route: "/level/level-1",
    zone: {
      top: "63%",
      left: "26%",
      width: "64%",
      height: "30%",
      borderRadius: "48% 52% 42% 58% / 38% 40% 60% 62%",
    },
  },
  {
    id: "level-2",
    name: "Rainbow World",
    locked: true,
    zone: {
      top: "44%",
      left: "3%",
      width: "40%",
      height: "20%",
      borderRadius: "55% 45% 50% 50% / 45% 55% 45% 55%",
    },
  },
  {
    id: "level-3",
    name: "Fruit City",
    locked: true,
    zone: {
      top: "28%",
      left: "40%",
      width: "44%",
      height: "22%",
      borderRadius: "50% 50% 45% 55% / 50% 45% 55% 50%",
    },
  },
  {
    id: "level-4",
    name: "Moon Forest",
    locked: true,
    zone: {
      top: "7%",
      left: "16%",
      width: "54%",
      height: "24%",
      borderRadius: "52% 48% 50% 50% / 42% 58% 42% 58%",
    },
  },
];

function IslandZone({
  island,
  onTap,
}: {
  island: Island;
  onTap: () => void;
}) {
  const isActive = !island.locked;
  const { zone } = island;

  return (
    <motion.button
      type="button"
      onClick={onTap}
      whileTap={isActive ? { scale: 0.98 } : undefined}
      aria-label={`${island.name}${island.locked ? " — locked" : " — play"}`}
      className="absolute z-10"
      style={{
        top: zone.top,
        left: zone.left,
        width: zone.width,
        height: zone.height,
        borderRadius: zone.borderRadius,
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: island.locked ? "not-allowed" : "pointer",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      {isActive && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: zone.borderRadius,
            border: "2px solid rgba(93, 204, 245, 0.55)",
            boxShadow: "0 0 18px rgba(93, 204, 245, 0.35)",
          }}
          animate={{ opacity: [0.35, 0.75, 0.35] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />
      )}
    </motion.button>
  );
}

export default function AksharvanMap() {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);

  const handleTap = (island: Island) => {
    if (island.locked) {
      setToast(island.name);
      setTimeout(() => setToast(null), 2200);
      return;
    }
    if (island.route) router.push(island.route);
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      <img
        src="/scenes/map.jpeg"
        alt="Aksharvan world map"
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {ISLANDS.map((island) => (
        <IslandZone key={island.id} island={island} onTap={() => handleTap(island)} />
      ))}

      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            className="absolute bottom-24 left-1/2 z-30 pointer-events-none"
            style={{ transform: "translateX(-50%)" }}
            initial={{ opacity: 0, y: 16, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
          >
            <div
              className="px-5 py-2.5 rounded-2xl font-body font-semibold text-white text-sm text-center"
              style={{
                background: "rgba(10,5,25,0.82)",
                backdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.18)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
              }}
            >
              🔒 {toast} — जल्द आ रहा है!
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
