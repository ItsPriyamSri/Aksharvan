'use client';

import { useState, useRef, useCallback } from 'react';
import { recognize, matchTranscript } from '../appwrite/services/asr';

type MicState = 'idle' | 'listening' | 'thinking' | 'result';

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface WebSpeechRecognition extends EventTarget {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  abort(): void;
}

interface WebSpeechRecognitionConstructor {
  new (): WebSpeechRecognition;
}

function getSpeechRecognitionCtor(): WebSpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const w = window as Window & {
    SpeechRecognition?: WebSpeechRecognitionConstructor;
    webkitSpeechRecognition?: WebSpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function useASR(
  expected: string[],
  exerciseId: string,
  onResult: (matched: boolean, transcript: string) => void,
): {
  arm(): void;
  stop(): void;
  micState: MicState;
  transcript: string;
  matched: boolean | null;
} {
  const [micState, setMicState] = useState<MicState>('idle');
  const [transcript, setTranscript] = useState('');
  const [matched, setMatched] = useState<boolean | null>(null);
  const recognitionRef = useRef<WebSpeechRecognition | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort();
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setMicState('idle');
  }, []);

  const handleResult = useCallback(
    (t: string) => {
      const m = matchTranscript(t, expected);
      setTranscript(t);
      setMatched(m);
      setMicState('result');
      onResult(m, t);
    },
    [expected, onResult],
  );

  const armWebSpeech = useCallback(() => {
    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) return;

    const recognition = new Ctor();
    recognition.lang = 'hi-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const t = event.results[0]?.[0]?.transcript ?? '';
      setMicState('thinking');
      handleResult(t);
    };

    recognition.onerror = () => {
      setMicState('idle');
    };

    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
      }
    };

    setMicState('listening');
    recognition.start();
  }, [handleResult]);

  const arm = useCallback(() => {
    if (typeof window === 'undefined') return;
    stop();
    setMicState('listening');
    chunksRef.current = [];

    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        const recorder = new MediaRecorder(stream);
        mediaRecorderRef.current = recorder;
        recorder.ondataavailable = (e) => chunksRef.current.push(e.data);
        recorder.onstop = async () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          setMicState('thinking');
          try {
            const arrayBuffer = await blob.arrayBuffer();
            const bytes = new Uint8Array(arrayBuffer);
            let binary = '';
            for (let i = 0; i < bytes.length; i++) {
              binary += String.fromCharCode(bytes[i]);
            }
            const base64 = btoa(binary);
            const result = await recognize({
              audioBase64: base64,
              mimeType: 'audio/webm',
              expected,
              exerciseId,
            });
            handleResult(result.transcript);
          } catch (err) {
            if (err instanceof Error && err.message === 'ASR_USE_WEB_SPEECH') {
              armWebSpeech();
            } else {
              setMicState('idle');
            }
          }
        };
        recorder.start();
        setTimeout(() => {
          if (recorder.state === 'recording') recorder.stop();
        }, 5000);
      })
      .catch(() => {
        armWebSpeech();
      });
  }, [stop, expected, exerciseId, handleResult, armWebSpeech]);

  return { arm, stop, micState, transcript, matched };
}
