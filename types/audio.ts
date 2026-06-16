// Aksharvan — Audio types

export type MicState = "idle" | "listening" | "thinking" | "success" | "error";

export type AudioClipStatus = "loading" | "ready" | "playing" | "error";

export type SpeakerCharacter = "tina" | "toto";

export type EncouragementPhrase = "शाबाश!" | "बहुत बढ़िया!" | "वाह!";

export const ENCOURAGEMENT_PHRASES: EncouragementPhrase[] = [
  "शाबाश!",
  "बहुत बढ़िया!",
  "वाह!",
];
