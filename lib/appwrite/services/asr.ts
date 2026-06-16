import { appwriteFunctions } from '../client';
import { isAppwriteConfigured } from '../config';
import { FUNCTION_ASR_RECOGNIZE } from '../constants';
import type { AsrRecognizeResponse } from '../types';

export async function recognize(params: {
  audioBase64: string;
  mimeType: string;
  expected: string[];
  exerciseId: string;
}): Promise<AsrRecognizeResponse> {
  if (!isAppwriteConfigured()) {
    throw new Error('ASR_USE_WEB_SPEECH');
  }
  const execution = await appwriteFunctions.createExecution(
    FUNCTION_ASR_RECOGNIZE,
    JSON.stringify(params),
  );
  return JSON.parse(execution.responseBody) as AsrRecognizeResponse;
}

export function isWebSpeechAvailable(): boolean {
  return (
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
  );
}

export function matchTranscript(transcript: string, expected: string[]): boolean {
  const norm = (s: string) => s.trim().toLowerCase();
  const t = norm(transcript);
  return expected.some((e) => {
    const n = norm(e);
    return t === n || t.includes(n) || n.includes(t);
  });
}
