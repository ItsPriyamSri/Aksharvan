"use client";

// MapRegion — a single clickable/locked region on the Aksharvan world map.
// Active: glowing, pulsing, tappable.
// Locked: greyed, lock icon, shows "जल्द आ रहा है" toast on tap.

import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type MapRegionData = {
  id: string;
  nameHi: string;
  nameRoman: string;
  locked: boolean;
  /** SVG centre point for this region on the map */
  cx: number;
  cy: number;
  /** Visual radius of the region bubble */
  r: number;
  /** Emoji or icon to show in the region */
  icon: string;
  /** Route to navigate to when tapped (active only) */
  href?: string;
};

type MapRegionProps = {
  region: MapRegionData;
  onNavigate: (href: string) => void;
};

export default function MapRegion({ region, onNavigate }: MapRegionProps) {
  const [showLockToast, setShowLockToast] = useState(false);

  const handleTap = useCallback(() => {
    if (region.locked) {
      setShowLockToast(true);
      setTimeout(() => setShowLockToast(false), 2200);
      return;
    }
    if (region.href) onNavigate(region.href);
  }, [region, onNavigate]);

  return (
    <g
      role="button"
      aria-label={`${region.nameHi}${region.locked ? " — बंद" : " — खेलें"}`}
      aria-disabled={region.locked}
      onClick={handleTap}
      onKeyDown={(e) => e.key === "Enter" && handleTap()}
      tabIndex={0}
      style={{ cursor: region.locked ? "not-allowed" : "pointer" }}
    >
      {/* ── Outer glow pulse (active only) ─────────────────────────── */}
      {!region.locked && (
        <motion.circle
          cx={region.cx}
          cy={region.cy}
          r={region.r + 10}
          fill="none"
          stroke="var(--firefly)"
          strokeWidth="2"
          animate={{ opacity: [0.4, 0.9, 0.4], r: [region.r + 8, region.r + 16, region.r + 8] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        />
      )}

      {/* ── Main circle ─────────────────────────────────────────────── */}
      <motion.circle
        cx={region.cx}
        cy={region.cy}
        r={region.r}
        fill={region.locked ? "#1a1a2e" : "var(--forest)"}
        stroke={region.locked ? "rgba(255,255,255,0.15)" : "var(--firefly)"}
        strokeWidth={region.locked ? 1.5 : 3}
        opacity={region.locked ? 0.55 : 1}
        whileHover={!region.locked ? { scale: 1.06 } : {}}
        whileTap={!region.locked ? { scale: 0.94 } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 20 }}
      />

      {/* ── Icon ────────────────────────────────────────────────────── */}
      <text
        x={region.cx}
        y={region.cy - 8}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize={region.r * 0.75}
        opacity={region.locked ? 0.4 : 1}
      >
        {region.icon}
      </text>

      {/* ── Hindi name ──────────────────────────────────────────────── */}
      <text
        x={region.cx}
        y={region.cy + region.r * 0.55}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="11"
        fontFamily="var(--font-mukta), sans-serif"
        fontWeight="600"
        fill={region.locked ? "rgba(255,255,255,0.3)" : "white"}
      >
        {region.nameHi}
      </text>

      {/* ── Lock icon (locked regions) ───────────────────────────────── */}
      {region.locked && (
        <g transform={`translate(${region.cx + region.r * 0.55}, ${region.cy - region.r * 0.55})`}>
          <circle r="10" fill="rgba(0,0,0,0.6)" />
          <text
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="11"
            opacity="0.7"
          >
            🔒
          </text>
        </g>
      )}

      {/* ── "जल्द आ रहा है" toast — rendered in foreignObject ──────── */}
      <AnimatePresence>
        {showLockToast && (
          <foreignObject
            x={region.cx - 70}
            y={region.cy - region.r - 52}
            width="140"
            height="44"
            style={{ overflow: "visible" }}
          >
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              className="px-3 py-2 rounded-xl bg-[var(--magic)] text-white
                         font-body text-xs text-center font-semibold shadow-card"
            >
              जल्द आ रहा है 🌟
            </motion.div>
          </foreignObject>
        )}
      </AnimatePresence>
    </g>
  );
}
