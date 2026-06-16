'use client';

import { useEffect, useState } from 'react';

interface Mote {
  id: number;
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
}

function generateMotes(count: number): Mote[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.round(Math.random() * 100),
    y: Math.round(Math.random() * 100),
    size: Math.round(Math.random() * 3 + 3),
    duration: Math.round(Math.random() * 4 + 6),
    delay: Math.round(Math.random() * 5),
  }));
}

interface FireflyMotesProps {
  count?: number;
  reducedMotion?: boolean;
}

export default function FireflyMotes({ count = 12, reducedMotion = false }: FireflyMotesProps) {
  const [motes, setMotes] = useState<Mote[]>([]);

  useEffect(() => {
    setMotes(generateMotes(count));
  }, [count]);

  if (reducedMotion) return null;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {motes.map(m => (
        <div
          key={m.id}
          className="absolute rounded-full bg-firefly opacity-0"
          style={{
            left: `${m.x}%`,
            top: `${m.y}%`,
            width: m.size,
            height: m.size,
            boxShadow: `0 0 ${m.size * 2}px var(--firefly-glow)`,
            animation: `fireflyFloat ${m.duration}s ${m.delay}s ease-in-out infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes fireflyFloat {
          0%, 100% { opacity: 0; transform: translate(0, 0); }
          20% { opacity: 0.9; }
          50% { opacity: 0.6; transform: translate(${12}px, -${18}px); }
          80% { opacity: 0.8; }
        }
        @media (prefers-reduced-motion: reduce) {
          [style*="fireflyFloat"] { animation: none !important; }
        }
      `}</style>
    </div>
  );
}
