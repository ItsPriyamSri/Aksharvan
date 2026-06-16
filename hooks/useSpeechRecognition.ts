"use client";

// useSpeechRecognition — browser Web Speech API for Hindi voice input.
// Uses any-typed wrappers to avoid DOM type conflicts in the Next.js TS config.

import { useState, useCallback, useRef } from "react";

type SpeechCallback = (matched: boolean, transcript: string, matchedOption?: string) => void;

export type SpeechState = {
  isListening:   boolean;
  isSupported:   boolean;
  isProcessing:  boolean;
  transcript:    string;
  error:         string | null;
  startListening: (expected: string[], onResult: SpeechCallback) => void;
  stopListening:  () => void;
};

function normalise(text: string): string {
  return text.trim().toLowerCase()
    .replace(/^(यह|यह है|है|एक|की|का)\s*/g, "").trim();
}

function matchesOption(transcript: string, option: string): boolean {
  const t = normalise(transcript);
  const o = normalise(option);
  if (!t || !o) return false;
  if (t === o) return true;
  if (t.includes(o)) return true;
  if (o.includes(t) && t.length >= 1) return true;
  if (t.length <= 2 && o.length >= 1 && t[0] === o[0]) return true;
  return false;
}

export function useSpeechRecognition(): SpeechState {
  const [isListening,  setIsListening]  = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript,   setTranscript]   = useState("");
  const [error,        setError]        = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const callbackRef    = useRef<SpeechCallback | null>(null);
  const optionsRef     = useRef<string[]>([]);

  const isSupported = typeof window !== "undefined" &&
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ("SpeechRecognition" in window || "webkitSpeechRecognition" in (window as any));

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
    }
    setIsListening(false);
    setIsProcessing(false);
  }, []);

  const startListening = useCallback((expectedOptions: string[], onResult: SpeechCallback) => {
    if (!isSupported) {
      setError("आपके ब्राउज़र में आवाज़ पहचान नहीं है");
      return;
    }
    if (recognitionRef.current) {
      try { recognitionRef.current.abort(); } catch { /* ignore */ }
    }

    callbackRef.current = onResult;
    optionsRef.current  = expectedOptions;
    setError(null);
    setTranscript("");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    const API = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!API) return;

    const recognition = new API();
    recognition.lang             = "hi-IN";
    recognition.interimResults   = false;
    recognition.maxAlternatives  = 5;
    recognition.continuous       = false;

    recognition.onstart = () => { setIsListening(true); setIsProcessing(false); };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      setIsProcessing(true);
      setIsListening(false);

      const allTexts: string[] = [];
      for (let i = 0; i < event.results.length; i++) {
        for (let j = 0; j < event.results[i].length; j++) {
          allTexts.push(event.results[i][j].transcript as string);
        }
      }

      const bestText = allTexts[0] ?? "";
      setTranscript(bestText);

      let matchedOption: string | undefined;
      let matched = false;
      outer: for (const text of allTexts) {
        for (const option of optionsRef.current) {
          if (matchesOption(text, option)) {
            matched = true;
            matchedOption = option;
            break outer;
          }
        }
      }

      setTimeout(() => {
        setIsProcessing(false);
        callbackRef.current?.(matched, bestText, matchedOption);
      }, 200);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      setIsListening(false);
      setIsProcessing(false);
      if (event.error === "no-speech")      setError("कुछ सुनाई नहीं दिया — फिर से बोलो");
      else if (event.error === "not-allowed") setError("माइक्रोफ़ोन की अनुमति चाहिए");
      else                                    setError("आवाज़ नहीं पहचानी — फिर कोशिश करो");
    };

    recognition.onend = () => { setIsListening(false); };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported]);

  return {
    isListening, isSupported, isProcessing,
    transcript, error,
    startListening, stopListening,
  };
}
