"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// Positions align badge centers with the circles drawn in map.jpeg
type Island = {
  id: string;
  num: number;
  name: string;
  top: string;
  left: string;
  badgeColor: string;
  locked: boolean;
  route?: string;
};

const ISLANDS: Island[] = [
  {
    id: "level-1", num: 1,
    name: "Magical Fairy Jungle",
    top: "71%", left: "52%",
    badgeColor: "#5DCCF5",
    locked: false, route: "/level/level-1",
  },
  {
    id: "level-2", num: 2,
    name: "Rainbow World",
    top: "52%", left: "22%",
    badgeColor: "#B47FE0",
    locked: true,
  },
  {
    id: "level-3", num: 3,
    name: "Fruit City",
    top: "37%", left: "61%",
    badgeColor: "#F5A623",
    locked: true,
  },
  {
    id: "level-4", num: 4,
    name: "Moon Forest",
    top: "18%", left: "43%",
    badgeColor: "#5DCCF5",
    locked: true,
  },
];

function IslandButton({
  island, onTap,
}: { island: Island; onTap: () => void }) {
  const isActive = !island.locked;

  return (
    <div
      className="absolute z-10"
      style={{ top: island.top, left: island.left, transform: "translate(-50%, -50%)" }}
    >
      <motion.button
        type="button"
        onClick={onTap}
        whileTap={{ scale: 0.85 }}
        className="relative flex items-center justify-center"
      >
        {/* Pulse rings — active level only */}
        {isActive && [0, 1].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 40, height: 40,
              top: "50%", left: "50%",
              marginTop: -20, marginLeft: -20,
              border: `2px solid ${island.badgeColor}`,
            }}
            animate={{ scale: [1, 2.4 + i * 0.5], opacity: [0.75, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, delay: i * 0.9, ease: "easeOut" }}
          />
        ))}

        {/* Badge */}
        <motion.div
          className="relative w-10 h-10 rounded-full flex items-center justify-center font-display font-extrabold z-10"
          style={{
            background: island.locked
              ? "rgba(20,10,40,0.55)"
              : `radial-gradient(circle at 38% 32%, white 0%, ${island.badgeColor} 80%)`,
            border: `2.5px solid ${island.locked ? "rgba(255,255,255,0.2)" : island.badgeColor}`,
            color: island.locked ? "rgba(255,255,255,0.35)" : "#1A0A00",
            fontSize: island.locked ? "1rem" : "1.25rem",
            boxShadow: isActive
              ? `0 3px 18px ${island.badgeColor}99, 0 0 0 2px white`
              : "0 2px 10px rgba(0,0,0,0.5)",
            backdropFilter: "blur(2px)",
          }}
          animate={isActive ? {
            boxShadow: [
              `0 3px 18px ${island.badgeColor}99, 0 0 0 2px white`,
              `0 3px 26px ${island.badgeColor}cc, 0 0 0 2px white`,
              `0 3px 18px ${island.badgeColor}99, 0 0 0 2px white`,
            ],
          } : {}}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        >
          {island.locked ? "🔒" : island.num}
        </motion.div>
      </motion.button>
    </div>
  );
}

export default function AksharvanMap() {
  const router = useRouter();
  const [toast, setToast] = useState<string | null>(null);

  const handleTap = (island: Island) => {
    if (island.locked) {
      setToast(island.name.replace("\n", " "));
      setTimeout(() => setToast(null), 2200);
      return;
    }
    if (island.route) router.push(island.route);
  };

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Map background */}
      <img
        src="/scenes/map.jpeg"
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        draggable={false}
      />

      {/* Island buttons */}
      {ISLANDS.map((island) => (
        <IslandButton key={island.id} island={island} onTap={() => handleTap(island)} />
      ))}

      {/* Coming soon toast */}
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
