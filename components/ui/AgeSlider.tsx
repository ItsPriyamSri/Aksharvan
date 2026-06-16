"use client";

// AgeSlider — drag/tap to set child age (4–10).
// Derives avatar_variant automatically: 4-5→0, 6-7→1, 8-10→2.
// Large touch target; shows age as a big number.

import React, { useCallback } from "react";
import { motion } from "framer-motion";
import { avatarVariantFromAge } from "@/types/progress";

const MIN_AGE = 4;
const MAX_AGE = 10;

// Age group labels for the three avatar variants
const AVATAR_LABELS: Record<0 | 1 | 2, string> = {
  0: "छोटे खिलाड़ी 🌱",
  1: "मंझले खिलाड़ी ⭐",
  2: "बड़े खिलाड़ी 🌟",
};

type AgeSliderProps = {
  value: number;            // 4..10
  onChange: (age: number) => void;
  disabled?: boolean;
};

export default function AgeSlider({ value, onChange, disabled = false }: AgeSliderProps) {
  const variant = avatarVariantFromAge(value);
  const percent = ((value - MIN_AGE) / (MAX_AGE - MIN_AGE)) * 100;

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange(Number(e.target.value));
    },
    [onChange]
  );

  // Accent color shifts with variant
  const trackColor =
    variant === 0 ? "var(--tina)" : variant === 1 ? "var(--firefly)" : "var(--toto)";

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Label */}
      <label htmlFor="age-slider" className="font-body text-surface/80 text-sm font-medium flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        बच्चे की उम्र
      </label>

      {/* Big age display */}
      <div className="flex items-center justify-center">
        <motion.div
          key={value}
          initial={{ scale: 0.75, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="flex flex-col items-center gap-1"
        >
          <span
            className="font-display text-7xl font-extrabold leading-none"
            style={{ color: trackColor }}
          >
            {value}
          </span>
          <span className="font-body text-surface/60 text-sm">साल</span>
        </motion.div>
      </div>

      {/* Avatar variant badge */}
      <motion.div
        key={variant}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        className="self-center px-4 py-1.5 rounded-full text-sm font-body font-semibold"
        style={{
          background: `${trackColor}22`,
          color: trackColor,
          border: `1.5px solid ${trackColor}55`,
        }}
      >
        {AVATAR_LABELS[variant]}
      </motion.div>

      {/* Slider */}
      <div className="relative w-full h-10 flex items-center">
        {/* Custom track fill */}
        <div className="absolute inset-y-0 left-0 right-0 flex items-center pointer-events-none">
          <div className="w-full h-3 rounded-full bg-surface/10 relative overflow-hidden">
            <motion.div
              className="absolute left-0 top-0 h-full rounded-full"
              animate={{ width: `${percent}%` }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              style={{ background: trackColor }}
            />
          </div>
        </div>

        {/* Native range input (transparent — overlaid for a11y & interaction) */}
        <input
          id="age-slider"
          type="range"
          min={MIN_AGE}
          max={MAX_AGE}
          step={1}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          aria-label={`बच्चे की उम्र: ${value} साल`}
          aria-valuemin={MIN_AGE}
          aria-valuemax={MAX_AGE}
          aria-valuenow={value}
          className="relative w-full h-10 opacity-0 cursor-pointer disabled:cursor-not-allowed"
          style={{ WebkitAppearance: "none" }}
        />
      </div>

      {/* Min/max labels */}
      <div className="flex justify-between font-body text-surface/40 text-xs px-0.5">
        <span>{MIN_AGE} साल</span>
        <span>{MAX_AGE} साल</span>
      </div>
    </div>
  );
}
