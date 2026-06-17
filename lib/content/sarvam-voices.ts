import config from "./sarvam-voices.json";
import type { SpeakerCharacter } from "@/types/audio";

export type SarvamVoiceProfile = {
  speaker: string;
  pace: number;
  playbackRate: number;
};

export const SARVAM_TTS_MODEL = config.model;
export const SARVAM_BROWSER_TTS = config.browserTtsFallback as Record<
  SpeakerCharacter,
  { pitch: number; rate: number }
>;

export function getSarvamVoice(character: SpeakerCharacter | "default"): SarvamVoiceProfile {
  const key = character === "tina" || character === "toto" ? character : "default";
  const v = config.voices[key];
  return { speaker: v.speaker, pace: v.pace, playbackRate: v.playbackRate ?? 1 };
}

/** Client-side clip speed multiplier (Howler rate) — Tina clips play faster without re-upload. */
export function getPlaybackRate(character: SpeakerCharacter): number {
  return getSarvamVoice(character).playbackRate;
}
