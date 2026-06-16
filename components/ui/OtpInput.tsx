"use client";

// OtpInput — 6-cell OTP entry.
// Each digit lives in its own box; focus auto-advances on entry,
// auto-retreats on backspace. Paste support included.

import React, { useRef, useCallback, useEffect } from "react";
import { motion } from "framer-motion";

const OTP_LENGTH = 6;

type OtpInputProps = {
  value: string;            // 0–6 digit string
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  onComplete?: (otp: string) => void;
};

export default function OtpInput({
  value,
  onChange,
  error,
  disabled = false,
  autoFocus = false,
  onComplete,
}: OtpInputProps) {
  const inputRefs = useRef<Array<HTMLInputElement | null>>(
    Array(OTP_LENGTH).fill(null)
  );

  // Focus first empty cell on mount when autoFocus is set
  useEffect(() => {
    if (autoFocus) {
      const firstEmpty = Math.min(value.length, OTP_LENGTH - 1);
      inputRefs.current[firstEmpty]?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoFocus]);

  const focusCell = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(OTP_LENGTH - 1, index));
    inputRefs.current[clamped]?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
      if (e.key === "Backspace") {
        e.preventDefault();
        if (value[index]) {
          // Clear current cell
          const next = value.slice(0, index) + value.slice(index + 1);
          onChange(next.padEnd(0, ""));
        } else if (index > 0) {
          // Move back and clear
          const next = value.slice(0, index - 1) + value.slice(index);
          onChange(next);
          focusCell(index - 1);
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        focusCell(index - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        focusCell(index + 1);
      }
    },
    [value, onChange, focusCell]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
      const raw = e.target.value;
      // Accept only digits
      const digit = raw.replace(/\D/g, "").slice(-1);
      if (!digit) return;

      const chars = value.split("");
      chars[index] = digit;
      const next = chars.join("").slice(0, OTP_LENGTH);
      onChange(next);

      if (next.length === OTP_LENGTH) {
        onComplete?.(next);
      } else {
        focusCell(index + 1);
      }
    },
    [value, onChange, onComplete, focusCell]
  );

  // Handle paste
  const handlePaste = useCallback(
    (e: React.ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData
        .getData("text")
        .replace(/\D/g, "")
        .slice(0, OTP_LENGTH);
      onChange(pasted);
      if (pasted.length === OTP_LENGTH) {
        onComplete?.(pasted);
        focusCell(OTP_LENGTH - 1);
      } else {
        focusCell(pasted.length);
      }
    },
    [onChange, onComplete, focusCell]
  );

  return (
    <div className="flex flex-col gap-3 w-full items-center">
      {/* Label */}
      <p className="font-body text-surface/80 text-sm font-medium self-start">
        SMS से आया 6-अंक कोड डालें
      </p>

      {/* OTP cells */}
      <div
        className="flex gap-2 justify-center"
        role="group"
        aria-label="OTP कोड"
      >
        {Array.from({ length: OTP_LENGTH }, (_, i) => {
          const isFilled  = i < value.length;
          const isActive  = i === value.length && !disabled;
          const cellDigit = value[i] ?? "";

          return (
            <motion.div
              key={i}
              animate={
                isFilled && !error
                  ? { scale: [1, 1.08, 1] }
                  : {}
              }
              transition={{ duration: 0.18 }}
              className={[
                "relative w-11 h-14 rounded-xl overflow-hidden",
                "border-2 transition-colors duration-150",
                error
                  ? "border-[var(--tina)] bg-[var(--tina)]/10"
                  : isActive
                  ? "border-[var(--firefly)] bg-surface/10"
                  : isFilled
                  ? "border-[var(--success)] bg-[var(--success)]/10"
                  : "border-surface/20 bg-surface/5",
              ].join(" ")}
            >
              <input
                ref={(el) => { inputRefs.current[i] = el; }}
                type="tel"
                inputMode="numeric"
                maxLength={2}          // allow 2 so replacement works
                value={cellDigit}
                onChange={(e) => handleChange(e, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                onPaste={handlePaste}
                onFocus={(e) => e.target.select()}
                disabled={disabled}
                aria-label={`OTP अंक ${i + 1}`}
                className={[
                  "absolute inset-0 w-full h-full text-center bg-transparent",
                  "font-display text-2xl font-bold outline-none",
                  error ? "text-[var(--tina)]" : "text-surface",
                  disabled ? "cursor-not-allowed" : "",
                ].join(" ")}
              />
            </motion.div>
          );
        })}
      </div>

      {/* Error */}
      {error && (
        <motion.p
          role="alert"
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-body text-[var(--tina)] text-sm text-center"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
