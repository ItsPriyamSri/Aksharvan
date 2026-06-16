"use client";

// VideoCutscenePlayer — plays a local MP4 video fullscreen with:
//   • autoplay (muted first for mobile autoplay policy, then unmutes on unlock)
//   • always-visible skip button
//   • completion callback → navigate to next route
//   • subtitle slot (populated when SRT/VTT files are available)
//   • dev: shows filename badge

import React, { useRef, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

type VideoCutscenePlayerProps = {
  /** Path to video in /public/videos/ e.g. "/videos/story1.mp4" */
  src: string;
  /** Route to push to after video ends or is skipped */
  onComplete: () => void;
  /** Optional VTT subtitle track src */
  subtitleSrc?: string;
  /** Show dev filename badge in development */
  showDevBadge?: boolean;
};

export default function VideoCutscenePlayer({
  src,
  onComplete,
  subtitleSrc,
  showDevBadge = process.env.NODE_ENV === "development",
}: VideoCutscenePlayerProps) {
  const videoRef  = useRef<HTMLVideoElement>(null);
  const [progress, setProgress]         = useState(0);   // 0–1
  const [hasStarted, setHasStarted]     = useState(false);
  const [showSkipHint, setShowSkipHint] = useState(true);
  const [skipConfirm, setSkipConfirm]   = useState(false);

  // Hide "skip" hint after 3s
  useEffect(() => {
    const t = setTimeout(() => setShowSkipHint(false), 3000);
    return () => clearTimeout(t);
  }, []);

  // Autoplay + progress tracking
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const onTimeUpdate = () => {
      if (video.duration) {
        setProgress(video.currentTime / video.duration);
      }
    };
    const onEnded = () => onComplete();
    const onPlay  = () => setHasStarted(true);

    video.addEventListener("timeupdate", onTimeUpdate);
    video.addEventListener("ended", onEnded);
    video.addEventListener("play", onPlay);

    // Attempt autoplay — mobile browsers may block; video will show poster
    video.play().catch(() => {
      // Autoplay blocked — user must tap the screen
    });

    return () => {
      video.removeEventListener("timeupdate", onTimeUpdate);
      video.removeEventListener("ended", onEnded);
      video.removeEventListener("play", onPlay);
    };
  }, [onComplete]);

  const handleSkip = useCallback(() => {
    if (!skipConfirm) {
      // First tap: show confirm state for 2s
      setSkipConfirm(true);
      const t = setTimeout(() => setSkipConfirm(false), 2000);
      return () => clearTimeout(t);
    }
    // Second tap: confirmed skip
    videoRef.current?.pause();
    onComplete();
  }, [skipConfirm, onComplete]);

  // Tap on video to play if autoplay was blocked
  const handleVideoTap = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().catch(() => {});
    }
  }, []);

  return (
    <div className="relative h-dvh w-full bg-black flex items-center justify-center overflow-hidden">
      {/* ── Video ──────────────────────────────────────────────────────── */}
      <video
        ref={videoRef}
        src={src}
        playsInline
        muted={false}
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover"
        onClick={handleVideoTap}
        onTouchStart={handleVideoTap}
        aria-label="कहानी वीडियो"
      >
        {/* Subtitle track — populated when VTT files are ready */}
        {subtitleSrc && (
          <track
            kind="subtitles"
            src={subtitleSrc}
            srcLang="hi"
            label="हिंदी"
            default
          />
        )}
      </video>

      {/* ── Tap-to-play overlay — only shown if autoplay blocked ─────── */}
      <AnimatePresence>
        {!hasStarted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center
                       bg-black/60 z-10 cursor-pointer"
            onClick={handleVideoTap}
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="w-20 h-20 rounded-full bg-[var(--firefly)] flex items-center
                         justify-center shadow-firefly-lg"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="var(--ink)">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </motion.div>
            <p className="font-body text-surface/80 mt-4 text-sm">
              शुरू करने के लिए टैप करें
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Progress bar ─────────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20 z-20">
        <motion.div
          className="h-full bg-[var(--firefly)]"
          style={{ width: `${progress * 100}%` }}
          transition={{ ease: "linear" }}
        />
      </div>

      {/* ── Skip button ──────────────────────────────────────────────── */}
      <div className="absolute top-safe right-4 pt-4 z-20">
        <motion.button
          type="button"
          onClick={handleSkip}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1, duration: 0.4 }}
          className={[
            "flex items-center gap-2 px-4 py-2 rounded-full font-body text-sm font-semibold",
            "transition-colors duration-200 min-h-[44px]",
            skipConfirm
              ? "bg-[var(--firefly)] text-ink"
              : "bg-black/40 text-white border border-white/30",
          ].join(" ")}
          aria-label="कहानी छोड़ें"
        >
          {skipConfirm ? "पक्का छोड़ें?" : "छोड़ें"}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2.5">
            <polyline points="13 17 18 12 13 7" />
            <polyline points="6 17 11 12 6 7" />
          </svg>
        </motion.button>

        {/* "Tap again to confirm" hint */}
        <AnimatePresence>
          {skipConfirm && (
            <motion.p
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="font-body text-white/70 text-xs text-right mt-1"
            >
              एक बार और टैप करें
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ── "Skip" floating hint — fades after 3s ──────────────────── */}
      <AnimatePresence>
        {showSkipHint && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.8 }}
            className="absolute top-safe left-4 pt-4 z-20"
          >
            <p className="font-body text-white/50 text-xs">
              ऊपर दाईं ओर छोड़ें बटन है
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Dev badge ────────────────────────────────────────────────── */}
      {showDevBadge && (
        <div className="absolute bottom-4 left-4 z-20 px-2 py-1 rounded bg-black/60
                        font-body text-white/50 text-xs">
          📹 {src.split("/").pop()}
        </div>
      )}
    </div>
  );
}
