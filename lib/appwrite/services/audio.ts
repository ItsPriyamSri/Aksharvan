import { storage } from '../client';
import { isAppwriteConfigured } from '../config';
import { BUCKET_AUDIO } from '../constants';

export function getAudioUrl(audioName: string): string {
  if (isAppwriteConfigured()) {
    return String(storage.getFileView(BUCKET_AUDIO, audioName));
  }
  return `/assets/audio/${audioName}.opus`;
}

export async function isAudioAvailable(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    return res.ok;
  } catch {
    return false;
  }
}

export function speakText(text: string, onEnd?: () => void): void {
  if (typeof window === 'undefined') return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'hi-IN';
  utterance.rate = 0.85;
  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
}

export function cancelSpeech(): void {
  if (typeof window === 'undefined') return;
  window.speechSynthesis.cancel();
}
