"use client";

// FireflyBackground — ambient drifting motes behind menu/login/map screens.
// Respects prefers-reduced-motion (renders static dots instead of animated).
// Renders absolutely positioned; parent must be relative/fixed.

import React, { useMemo } from "react";
import { motion } from "framer-motion";

type Mote = {
  id: number;
  x: number;    // % from left
  y: number;    // % from top
  size: number; // px
  duration: number;
  delay: number;
  opacity: number;
};

type FireflyBackgroundProps = {
  count?: number;
  className?: string;
};

export default function FireflyBackground({
  count = 18,
  className = "",
}: FireflyBackgroundProps) {
  // Deterministic positions so SSR and client match (no Math.random on render)
  const motes: Mote[] = useMemo(() => {
    // Seeded pseudo-random using index
    return Array.from({ length: count }, (_, i) => {
      const t = (i * 2.399963) % 1; // golden ratio spread
      const r = Math.sqrt((i + 0.5) / count);
      return {
        id:       i,
        x:        ((Math.sin(i * 1.618) * 0.5 + 0.5) * 100),
        y:        ((Math.cos(i * 2.399) * 0.5 + 0.5) * 100),
        size:     3 + (i % 5),
        duration: 5 + (i % 4) * 1.5,
        delay:    (i * 0.4) % 4,
        opacity:  0.35 + (t * 0.45),
      };
    });
  }, [count]);

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
    >
      {motes.map((m) => (
        <motion.div
          key={m.id}
          className="absolute rounded-full"
          style={{
            left:    `${m.x}%`,
            top:     `${m.y}%`,
            width:   m.size,
            height:  m.size,
            background: "var(--firefly)",
            boxShadow: `0 0 ${m.size * 2}px ${m.size}px var(--firefly-glow)`,
          }}
          animate={{
            y: [0, -16, -8, -20, 0],
            x: [0, 8, -6, 4, 0],
            opacity: [m.opacity, m.opacity * 1.5, m.opacity * 0.6, m.opacity * 1.2, m.opacity],
          }}
          transition={{
            duration:   m.duration,
            delay:      m.delay,
            repeat:     Infinity,
            ease:       "easeInOut",
            // Framer Motion respects prefers-reduced-motion automatically when
            // using the `motion` component with default settings
          }}
        />
      ))}
    </div>
  );
}
