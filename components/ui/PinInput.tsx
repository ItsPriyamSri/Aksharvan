"use client";

// PinInput — 4-digit PIN setup or entry.
// "setup" mode shows two fields (PIN + confirm); "enter" mode shows one.
// Dots hide the digits for privacy; a peek toggle is available.

import React, { useRef, useCallback, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PIN_LENGTH = 4;

type PinMode = "setup" | "enter";

type PinInputProps = {
  mode: PinMode;
  pin: string;
  confirmPin?: string;          // only used in "setup" mode
  onPinChange: (pin: string) => void;
  onConfirmChange?: (pin: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
};

// ─── Single row of 4 cells ────────────────────────────────────────────────────

type PinRowProps = {
  value: string;
  onChange: (v: string) => void;
  onComplete?: () => void;
  error?: boolean;
  disabled?: boolean;
  show?: boolean;
  autoFocus?: boolean;
  label: string;
};

function PinRow({
  value,
  onChange,
  onComplete,
  error = false,
  disabled = false,
  show = false,
  autoFocus = false,
  label,
}: PinRowProps) {
  const refs = useRef<Array<HTMLInputElement | null>>(Array(PIN_LENGTH).fill(null));

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const focusCell = (i: number) => {
    const c = Math.max(0, Math.min(PIN_LENGTH - 1, i));
    refs.current[c]?.focus();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, i: number) => {
    const digit = e.target.value.replace(/\D/g, "").slice(-1);
    if (!digit) return;
    const chars = value.split("");
    chars[i] = digit;
    const next = chars.join("").slice(0, PIN_LENGTH);
    onChange(next);
    if (next.length === PIN_LENGTH) {
      onComplete?.();
    } else {
      focusCell(i + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, i: number) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (value[i]) {
        const next = value.slice(0, i) + value.slice(i + 1);
        onChange(next);
      } else if (i > 0) {
        const next = value.slice(0, i - 1) + value.slice(i);
        onChange(next);
        focusCell(i - 1);
      }
    }
    if (e.key === "ArrowLeft") { e.preventDefault(); focusCell(i - 1); }
    if (e.key === "ArrowRight") { e.preventDefault(); focusCell(i + 1); }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const digits = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, PIN_LENGTH);
    onChange(digits);
    if (digits.length === PIN_LENGTH) onComplete?.();
    focusCell(Math.min(digits.length, PIN_LENGTH - 1));
  };

  return (
    <div className="flex flex-col gap-2 items-center w-full">
      <p className="font-body text-surface/60 text-xs self-start">{label}</p>
      <div className="flex gap-3 justify-center" role="group">
        {Array.from({ length: PIN_LENGTH }, (_, i) => {
          const filled  = i < value.length;
          const active  = i === value.length && !disabled;
          const cellVal = value[i] ?? "";

          return (
            <motion.div
              key={i}
              animate={filled ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 0.15 }}
              className={[
                "relative w-14 h-14 rounded-2xl border-2 transition-colors duration-150",
                error
                  ? "border-[var(--tina)] bg-[var(--tina)]/10"
                  : active
                  ? "border-[var(--firefly)] bg-surface/10"
                  : filled
                  ? "border-[var(--success)]/60 bg-[var(--success)]/10"
                  : "border-surface/20 bg-surface/5",
              ].join(" ")}
            >
              {/* Hidden real input */}
              <input
                ref={(el) => { refs.current[i] = el; }}
                type={show ? "tel" : "password"}
                inputMode="numeric"
                maxLength={2}
                value={show ? cellVal : cellVal ? "•" : ""}
                onChange={(e) => handleChange(e, i)}
                onKeyDown={(e) => handleKeyDown(e, i)}
                onPaste={handlePaste}
                onFocus={(e) => e.target.select()}
                disabled={disabled}
                aria-label={`PIN अंक ${i + 1}`}
                className={[
                  "absolute inset-0 w-full h-full text-center bg-transparent outline-none",
                  "font-display text-2xl font-bold",
                  error ? "text-[var(--tina)]" : "text-surface",
                  !show && filled ? "text-3xl" : "",
                  disabled ? "cursor-not-allowed" : "",
                ].join(" ")}
              />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Main PinInput component ──────────────────────────────────────────────────

export default function PinInput({
  mode,
  pin,
  confirmPin = "",
  onPinChange,
  onConfirmChange,
  error,
  disabled = false,
  autoFocus = false,
}: PinInputProps) {
  const [showPins, setShowPins] = useState(false);

  const pinsMatch =
    mode === "setup" && pin.length === PIN_LENGTH && confirmPin.length === PIN_LENGTH
      ? pin === confirmPin
      : true;

  return (
    <div className="flex flex-col gap-5 w-full items-center">
      {/* Label row */}
      <div className="flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"
            className="text-surface/80">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="font-body text-surface/80 text-sm font-medium">
            {mode === "setup" ? "4-अंक PIN बनाएं" : "PIN डालें"}
          </span>
        </div>
        {/* Peek toggle */}
        <button
          type="button"
          onClick={() => setShowPins((s) => !s)}
          className="flex items-center gap-1 text-surface/40 hover:text-surface/70 transition-colors min-h-0 h-auto p-1"
          aria-label={showPins ? "PIN छुपाएं" : "PIN दिखाएं"}
        >
          {showPins ? (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
          <span className="text-xs">{showPins ? "छुपाएं" : "देखें"}</span>
        </button>
      </div>

      {/* PIN row 1 */}
      <PinRow
        value={pin}
        onChange={onPinChange}
        onComplete={mode === "setup" ? undefined : undefined}
        error={!!error || (mode === "setup" && !pinsMatch && confirmPin.length === PIN_LENGTH)}
        disabled={disabled}
        show={showPins}
        autoFocus={autoFocus}
        label={mode === "setup" ? "नया PIN" : "अपना PIN"}
      />

      {/* Confirm row (setup only) */}
      <AnimatePresence>
        {mode === "setup" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="w-full overflow-hidden"
          >
            <PinRow
              value={confirmPin}
              onChange={onConfirmChange ?? (() => {})}
              error={!pinsMatch && confirmPin.length === PIN_LENGTH}
              disabled={disabled}
              show={showPins}
              label="PIN दोबारा डालें"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Match feedback */}
      <AnimatePresence>
        {mode === "setup" && confirmPin.length === PIN_LENGTH && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            role="alert"
            className={[
              "font-body text-sm font-medium",
              pinsMatch ? "text-[var(--success)]" : "text-[var(--tina)]",
            ].join(" ")}
          >
            {pinsMatch ? "✓ PIN मेल खाते हैं" : "✗ PIN अलग हैं — दोबारा कोशिश करें"}
          </motion.p>
        )}
      </AnimatePresence>

      {/* External error */}
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
