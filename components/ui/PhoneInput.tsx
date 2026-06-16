"use client";

// PhoneInput — Indian phone number entry.
// Shows "+91" prefix locked; accepts a 10-digit number.
// Validates format client-side before allowing submit.

import React, { useRef, useCallback } from "react";
import { motion } from "framer-motion";

type PhoneInputProps = {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  /** Called when the user presses Enter or taps the submit button */
  onSubmit?: () => void;
};

export default function PhoneInput({
  value,
  onChange,
  error,
  disabled = false,
  onSubmit,
}: PhoneInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      // Strip non-digits; cap at 10 chars
      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
      onChange(digits);
    },
    [onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && value.length === 10) {
        onSubmit?.();
      }
    },
    [value, onSubmit]
  );

  const isValid = value.length === 10;

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Label */}
      <label
        htmlFor="phone-input"
        className="font-body text-surface/80 text-sm font-medium"
      >
        {/* Icon + Hindi label */}
        <span className="flex items-center gap-2">
          <svg
            width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.6 3.34 2 2 0 0 1 3.56 1h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.54a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          माता/पिता का फ़ोन नंबर
        </span>
      </label>

      {/* Input row */}
      <div
        className={[
          "flex items-center gap-0 rounded-2xl overflow-hidden",
          "border-2 transition-colors duration-200",
          error
            ? "border-[#F2789A]"
            : isValid
            ? "border-[var(--success)]"
            : "border-surface/20 focus-within:border-[var(--firefly)]",
          disabled ? "opacity-50" : "",
        ].join(" ")}
      >
        {/* Country code badge */}
        <div className="flex items-center justify-center px-4 h-14 bg-surface/10 border-r-2 border-surface/10 shrink-0">
          <span className="font-body text-surface font-bold text-base select-none">
            🇮🇳 +91
          </span>
        </div>

        {/* Number field */}
        <input
          ref={inputRef}
          id="phone-input"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="10-अंक नंबर"
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          maxLength={10}
          aria-label="फ़ोन नंबर (10 अंक)"
          aria-invalid={!!error}
          aria-describedby={error ? "phone-error" : undefined}
          className={[
            "flex-1 h-14 px-4 bg-transparent outline-none",
            "font-body text-surface text-xl tracking-widest",
            "placeholder:text-surface/30 placeholder:text-base placeholder:tracking-normal",
            disabled ? "cursor-not-allowed" : "",
          ].join(" ")}
        />

        {/* Valid check mark */}
        {isValid && !error && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="pr-4 text-[var(--success)]"
            aria-hidden="true"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </motion.div>
        )}
      </div>

      {/* Error */}
      {error && (
        <motion.p
          id="phone-error"
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-body text-[var(--tina)] text-sm flex items-center gap-1"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" stroke="white" strokeWidth="2" />
            <circle cx="12" cy="16" r="1" fill="white" />
          </svg>
          {error}
        </motion.p>
      )}

      {/* Hint */}
      {!error && (
        <p className="font-body text-surface/40 text-xs">
          उदाहरण: 98765 43210
        </p>
      )}
    </div>
  );
}

// ─── Validation helper (exported for use in the form) ────────────────────────

export function validateIndianPhone(digits: string): string | null {
  if (!digits) return "फ़ोन नंबर ज़रूरी है";
  if (digits.length !== 10) return "10-अंक का नंबर डालें";
  if (!/^[6-9]/.test(digits)) return "भारतीय मोबाइल नंबर 6-9 से शुरू होता है";
  return null;
}
