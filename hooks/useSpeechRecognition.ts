"use client";

import { useState, useCallback, useRef } from "react";
import { recognizeSpeech } from "@/lib/appwrite/functions";
import { matchTranscript } from "@/lib/speech/match";
import {
  blobToBase64,
  getMicStream,
  releaseMicStream,
  recordAudioFromStream,
  type MicStream,
} from "@/lib/speech/mic";

type SpeechCallback = (matched: boolean, transcript: string, matchedOption?: string) => void;

export type VoiceInputMode = "webspeech" | "recorder" | "none";

export type SpeechState = {
  isListening: boolean;
  isSupported: boolean;
  isProcessing: boolean;
  transcript: string;
  error: string | null;
  inputMode: VoiceInputMode;
  startListening: (expected: string[], onResult: SpeechCallback, exerciseId?: string) => void;
  stopListening: () => void;
};

const LISTEN_TIMEOUT_MS = 7000;
const MIN_LISTEN_MS = 900;
const MIN_BLOB_BYTES = 200;

const APPWRITE_CONFIGURED =
  typeof process !== "undefined"
  && Boolean(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID)
  && process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID !== "your_project_id";

function hasWebSpeech(): boolean {
  if (typeof window === "undefined") return false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  return Boolean(w.SpeechRecognition ?? w.webkitSpeechRecognition);
}

function hasMediaRecorder(): boolean {
  return typeof navigator !== "undefined"
    && Boolean(navigator.mediaDevices?.getUserMedia)
    && typeof MediaRecorder !== "undefined";
}

export function useSpeechRecognition(): SpeechState {
  const [isListening,  setIsListening]  = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript,   setTranscript]   = useState("");
  const [error,        setError]        = useState<string | null>(null);
  const [inputMode,    setInputMode]    = useState<VoiceInputMode>("none");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const callbackRef    = useRef<SpeechCallback | null>(null);
  const optionsRef     = useRef<string[]>([]);
  const exerciseIdRef  = useRef<string>("exercise");
  const gotResultRef   = useRef(false);
  const timeoutRef     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionRef     = useRef(0);
  const startedAtRef   = useRef(0);
  const streamRef      = useRef<MicStream | null>(null);
  const endRetryRef    = useRef(0);

  const webSpeechAvailable = hasWebSpeech();
  const recorderAvailable  = hasMediaRecorder();
  const canUseServerAsr    = APPWRITE_CONFIGURED && recorderAvailable;
  const isSupported        = canUseServerAsr || webSpeechAvailable;
  const canUseServerAsrRef = useRef(canUseServerAsr);
  canUseServerAsrRef.current = canUseServerAsr;

  const clearTimeoutRef = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const releaseStream = useCallback(() => {
    releaseMicStream(streamRef.current);
    streamRef.current = null;
  }, []);

  const deliverResult = useCallback((session: number, matched: boolean, text: string, option?: string) => {
    if (session !== sessionRef.current) return;
    if (gotResultRef.current) return;
    gotResultRef.current = true;
    clearTimeoutRef();
    releaseStream();
    setIsProcessing(false);
    setIsListening(false);
    const cb = callbackRef.current;
    callbackRef.current = null;
    cb?.(matched, text, option);
  }, [releaseStream]);

  const stopListening = useCallback(() => {
    sessionRef.current += 1;
    clearTimeoutRef();
    callbackRef.current = null;
    gotResultRef.current = true;
    endRetryRef.current = 0;
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    releaseStream();
    setIsListening(false);
    setIsProcessing(false);
  }, [releaseStream]);

  const ensureStream = useCallback(async (session: number): Promise<MicStream | null> => {
    if (session !== sessionRef.current) return null;
    if (streamRef.current?.active) return streamRef.current;
    try {
      const stream = await getMicStream();
      if (session !== sessionRef.current) {
        releaseMicStream(stream);
        return null;
      }
      streamRef.current = stream;
      return stream;
    } catch {
      return null;
    }
  }, []);

  const runRecorderAsr = useCallback(async (session: number, attempt = 0): Promise<boolean> => {
    if (session !== sessionRef.current) return false;

    setInputMode("recorder");
    setIsListening(true);
    setIsProcessing(false);
    setError(null);

    try {
      const stream = await ensureStream(session);
      if (!stream) {
        setError("माइक्रोफ़ोन की अनुमति चाहिए");
        deliverResult(session, false, "");
        return false;
      }

      const { blob, mimeType } = await recordAudioFromStream(stream, {
        maxMs: LISTEN_TIMEOUT_MS,
        minMs: 500,
        silenceMs: 1300,
      });

      if (session !== sessionRef.current) return false;

      if (blob.size < MIN_BLOB_BYTES) {
        if (attempt < 1) {
          gotResultRef.current = false;
          return runRecorderAsr(session, attempt + 1);
        }
        setError("कुछ सुनाई नहीं दिया — फिर से बोलो");
        deliverResult(session, false, "");
        return false;
      }

      setIsListening(false);
      setIsProcessing(true);

      const audioBase64 = await blobToBase64(blob);
      if (session !== sessionRef.current) return false;

      const asr = await recognizeSpeech({
        audioBase64,
        mimeType,
        expected: optionsRef.current,
        exerciseId: exerciseIdRef.current,
      });

      if (session !== sessionRef.current) return false;

      const text = asr.transcript ?? "";
      setTranscript(text);

      if (asr.matched) {
        const matchedOption = optionsRef.current.find(
          (o) => matchTranscript(text, [o], asr.confidence ?? 0).matched,
        );
        deliverResult(session, true, text, matchedOption);
        return true;
      }

      const { matched } = matchTranscript(text, optionsRef.current, asr.confidence ?? 0);
      const matchedOption = matched
        ? optionsRef.current.find((o) => matchTranscript(text, [o], asr.confidence ?? 0).matched)
        : undefined;

      deliverResult(session, matched, text, matchedOption);
      return true;
    } catch {
      if (session !== sessionRef.current) return false;
      if (attempt < 1) {
        gotResultRef.current = false;
        releaseStream();
        return runRecorderAsr(session, attempt + 1);
      }
      return false;
    }
  }, [deliverResult, ensureStream, releaseStream]);

  const startWebSpeech = useCallback((session: number, onAsrFallback?: () => void): boolean => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const API = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!API) return false;

    setInputMode("webspeech");
    endRetryRef.current = 0;

    const recognition = new API();
    recognition.lang = "hi-IN";
    recognition.interimResults = true;
    recognition.maxAlternatives = 5;
    recognition.continuous = false;

    recognition.onstart = () => {
      if (session !== sessionRef.current) return;
      startedAtRef.current = Date.now();
      setIsListening(true);
      setIsProcessing(false);
      clearTimeoutRef();
      timeoutRef.current = setTimeout(() => {
        if (session !== sessionRef.current || gotResultRef.current) return;
        try { recognition.stop(); } catch { /* ignore */ }
      }, LISTEN_TIMEOUT_MS);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      if (session !== sessionRef.current) return;

      const allTexts: string[] = [];
      for (let i = 0; i < event.results.length; i++) {
        for (let j = 0; j < event.results[i].length; j++) {
          allTexts.push(event.results[i][j].transcript as string);
        }
      }

      const bestText = allTexts[allTexts.length - 1] ?? "";
      if (bestText) setTranscript(bestText);

      const isFinal = event.results[event.results.length - 1]?.isFinal;
      if (!isFinal) return;

      setIsProcessing(true);
      setIsListening(false);

      let matchedOption: string | undefined;
      let matched = false;
      outer: for (const text of allTexts) {
        const result = matchTranscript(text, optionsRef.current);
        if (result.matched) {
          matched = true;
          matchedOption = optionsRef.current.find(
            (o) => matchTranscript(text, [o]).matched,
          );
          break outer;
        }
      }

      try { recognition.stop(); } catch { /* ignore */ }
      deliverResult(session, matched, bestText, matchedOption);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      if (session !== sessionRef.current) return;
      setIsListening(false);
      setIsProcessing(false);
      clearTimeoutRef();

      if (event.error === "aborted") return;

      const elapsed = Date.now() - startedAtRef.current;

      if (event.error === "no-speech" && elapsed < MIN_LISTEN_MS && endRetryRef.current < 2) {
        endRetryRef.current += 1;
        gotResultRef.current = false;
        try { recognition.start(); } catch { /* ignore */ }
        return;
      }

      const tryAsrFallback = event.error === "network" || event.error === "service-not-allowed";
      if (tryAsrFallback && canUseServerAsrRef.current) {
        gotResultRef.current = false;
        recognitionRef.current = null;
        onAsrFallback?.();
        return;
      }

      if (event.error === "no-speech") {
        setError("कुछ सुनाई नहीं दिया — फिर से बोलो");
      } else if (event.error === "not-allowed") {
        setError("माइक्रोफ़ोन की अनुमति चाहिए");
      } else if (event.error === "network") {
        setError("आवाज़ सेवा नहीं मिली — फिर माइक दबाएँ");
      } else {
        setError("आवाज़ नहीं पहचानी — फिर कोशिश करो");
      }

      deliverResult(session, false, "");
    };

    recognition.onend = () => {
      if (session !== sessionRef.current) return;
      setIsListening(false);
      if (gotResultRef.current) return;

      const elapsed = Date.now() - startedAtRef.current;
      if (elapsed < MIN_LISTEN_MS && endRetryRef.current < 2) {
        endRetryRef.current += 1;
        gotResultRef.current = false;
        try { recognition.start(); } catch { /* ignore */ }
        return;
      }

      deliverResult(session, false, "");
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      return true;
    } catch {
      return false;
    }
  }, [deliverResult]);

  const startListening = useCallback((
    expectedOptions: string[],
    onResult: SpeechCallback,
    exerciseId = "exercise",
  ) => {
    if (!isSupported) {
      setError("माइक उपलब्ध नहीं — नीचे टैप करो");
      return;
    }

    sessionRef.current += 1;
    const session = sessionRef.current;

    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
      recognitionRef.current = null;
    }
    releaseStream();

    callbackRef.current = onResult;
    optionsRef.current = expectedOptions;
    exerciseIdRef.current = exerciseId;
    gotResultRef.current = false;
    endRetryRef.current = 0;
    setError(null);
    setTranscript("");
    setIsListening(true);
    setIsProcessing(false);

    const tryAsr = () => {
      gotResultRef.current = false;
      void (async () => {
        const ok = await runRecorderAsr(session);
        if (ok || session !== sessionRef.current) return;

        if (webSpeechAvailable) {
          const started = startWebSpeech(session, tryAsr);
          if (started) return;
        }

        setError("आवाज़ नहीं पहचानी — नीचे टैप करो या फिर माइक दबाएँ");
        deliverResult(session, false, "");
      })();
    };

    void (async () => {
      const stream = await ensureStream(session);
      if (session !== sessionRef.current) return;

      if (!stream) {
        setIsListening(false);
        setError("माइक्रोफ़ोन की अनुमति चाहिए");
        deliverResult(session, false, "");
        return;
      }

      if (canUseServerAsr) {
        tryAsr();
        return;
      }

      if (webSpeechAvailable) {
        const started = startWebSpeech(session, tryAsr);
        if (started) return;
      }

      setIsListening(false);
      setError("माइक शुरू नहीं हो सका — फिर दबाएँ");
      deliverResult(session, false, "");
    })();
  }, [
    isSupported,
    canUseServerAsr,
    webSpeechAvailable,
    runRecorderAsr,
    startWebSpeech,
    deliverResult,
    ensureStream,
    releaseStream,
  ]);

  return {
    isListening,
    isSupported,
    isProcessing,
    transcript,
    error,
    inputMode,
    startListening,
    stopListening,
  };
}
