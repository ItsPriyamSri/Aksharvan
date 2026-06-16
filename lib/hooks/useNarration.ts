'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { getAudioUrl, isAudioAvailable, speakText, cancelSpeech } from '../appwrite/services/audio';
import manifestData from '../content/narration-manifest.json';

interface ManifestEntry {
  audioName: string;
  text: string;
  voice: string;
  category: string;
}

const manifest: ManifestEntry[] = (manifestData as { entries: ManifestEntry[] }).entries;

function findSubtitle(audioName: string): string | null {
  const entry = manifest.find((e) => e.audioName === audioName);
  return entry?.text ?? null;
}

export function useNarration(
  audioName: string,
  speaker: 'tina' | 'toto',
): {
  play(onEnd?: () => void): void;
  stop(): void;
  isPlaying: boolean;
  subtitle: string | null;
} {
  const [isPlaying, setIsPlaying] = useState(false);
  const [subtitle, setSubtitle] = useState<string | null>(null);
  const howlRef = useRef<{ stop(): void; play(): void; on(event: string, cb: () => void): void } | null>(null);
  const urlRef = useRef<string>('');
  const availableRef = useRef<boolean>(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const url = getAudioUrl(audioName);
    urlRef.current = url;

    if (typeof window === 'undefined') return;

    isAudioAvailable(url).then((available) => {
      if (!mountedRef.current) return;
      availableRef.current = available;
    });
  }, [audioName, speaker]);

  const stop = useCallback(() => {
    if (howlRef.current) {
      howlRef.current.stop();
      howlRef.current = null;
    }
    cancelSpeech();
    setIsPlaying(false);
  }, []);

  const play = useCallback(
    (onEnd?: () => void) => {
      if (typeof window === 'undefined') return;

      stop();
      setIsPlaying(true);
      setSubtitle(findSubtitle(audioName));

      if (availableRef.current) {
        import('howler').then(({ Howl }) => {
          if (!mountedRef.current) return;
          const howl = new Howl({
            src: [urlRef.current],
            onend: () => {
              if (mountedRef.current) setIsPlaying(false);
              onEnd?.();
            },
            onstop: () => {
              if (mountedRef.current) setIsPlaying(false);
            },
          });
          howlRef.current = howl;
          howl.play();
        });
      } else {
        const text = findSubtitle(audioName);
        if (text) {
          speakText(text, () => {
            if (mountedRef.current) setIsPlaying(false);
            onEnd?.();
          });
        } else {
          setIsPlaying(false);
          onEnd?.();
        }
      }
    },
    [audioName, stop],
  );

  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return { play, stop, isPlaying, subtitle };
}
