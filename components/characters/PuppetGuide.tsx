'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface PuppetGuideProps {
  character: 'tina' | 'toto';
  speaking?: boolean;
  size?: number;
}

const bobVariants = {
  idle: {
    y: [0, -6, 0],
    transition: { duration: 2.4, repeat: Infinity, ease: 'easeInOut' as const },
  },
  speaking: {
    y: [0, -10, 0],
    transition: { duration: 1.2, repeat: Infinity, ease: 'easeInOut' as const },
  },
};

export default function PuppetGuide({ character, speaking = false, size = 120 }: PuppetGuideProps) {
  const [imgError, setImgError] = useState(false);
  const glowColor = character === 'tina' ? 'var(--tina)' : 'var(--toto)';
  const label = character === 'tina' ? 'टीना' : 'टोटो';
  const emoji = character === 'tina' ? '🧑' : '🐘';

  return (
    <div className="relative flex flex-col items-center" role="img" aria-label={label}>
      {speaking && (
        <div
          className="absolute inset-0 rounded-full opacity-40 blur-xl pointer-events-none"
          style={{ backgroundColor: glowColor, transform: 'scale(1.3)' }}
          aria-hidden="true"
        />
      )}
      <motion.div
        variants={bobVariants}
        animate={speaking ? 'speaking' : 'idle'}
        style={{ width: size, height: size, position: 'relative' }}
      >
        {imgError ? (
          <div
            className="w-full h-full rounded-full flex items-center justify-center text-4xl select-none"
            style={{ backgroundColor: glowColor, opacity: 0.85 }}
          >
            {emoji}
          </div>
        ) : (
          <img
            src={`/assets/characters/${character}_stick.webp`}
            alt={label}
            width={size}
            height={size}
            className="rounded-full object-cover w-full h-full"
            onError={() => setImgError(true)}
          />
        )}
      </motion.div>
      <p className="mt-1 text-xs font-mukta font-semibold" style={{ color: glowColor }}>
        {label}
      </p>
    </div>
  );
}
