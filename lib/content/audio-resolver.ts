// Maps exercise / scene prompts to narration-manifest audioName IDs.
// File IDs in Appwrite audio bucket match audioName exactly.

import type { SpeakerCharacter } from "@/types/audio";

export type ScenePromptKind =
  | "name_object"
  | "first_sound"
  | "blend"
  | "memory"
  | "word_build";

const PROMPT_IDS: Record<ScenePromptKind, Record<SpeakerCharacter, string>> = {
  name_object: {
    tina: "prompt_yeh_kya_hai__tina",
    toto: "prompt_yeh_kya_hai__toto",
  },
  first_sound: {
    tina: "prompt_pehli_awaz__tina",
    toto: "prompt_pehli_awaz__toto",
  },
  blend: {
    tina: "prompt_jodkar__tina",
    toto: "prompt_jodkar__toto",
  },
  memory: {
    tina: "prompt_memory__tina",
    toto: "prompt_memory__toto",
  },
  word_build: {
    tina: "prompt_match_build__tina",
    toto: "prompt_match_build__toto",
  },
};


export function getScenePromptAudioId(
  kind: ScenePromptKind,
  speaker: SpeakerCharacter,
): string {
  return PROMPT_IDS[kind][speaker];
}

const PRAISE_LINES: Record<SpeakerCharacter, { audioId: string; textHi: string; displayHi: string }[]> = {
  tina: [
    { audioId: "encourage_shabash__tina",       textHi: "शाबाश!",        displayHi: "शाबाश! 🌟" },
    { audioId: "encourage_bahut_badhiya__tina", textHi: "बहुत बढ़िया!", displayHi: "बहुत बढ़िया! ✨" },
    { audioId: "encourage_wah__tina",           textHi: "वाह!",          displayHi: "वाह! 🌈" },
  ],
  toto: [
    { audioId: "encourage_shabash__toto",       textHi: "शाबाश!",        displayHi: "शाबाश! 🌟" },
    { audioId: "encourage_bahut_badhiya__toto", textHi: "बहुत बढ़िया!", displayHi: "बहुत बढ़िया! ✨" },
    { audioId: "encourage_wah__toto",           textHi: "वाह!",          displayHi: "वाह! 🌈" },
  ],
};

const RETRY_LINES: Record<SpeakerCharacter, { audioId: string; textHi: string; displayHi: string }[]> = {
  tina: [
    { audioId: "nudge_try_again__tina", textHi: "कोई बात नहीं, फिर से कोशिश करो।", displayHi: "फिर से कोशिश करो 💪" },
    { audioId: "nudge_listen__tina",    textHi: "ध्यान से सुनो।",                  displayHi: "ध्यान से सुनो 👂" },
  ],
  toto: [
    { audioId: "nudge_try_again__toto", textHi: "कोई बात नहीं, फिर से कोशिश करो।", displayHi: "फिर से कोशिश करो 💪" },
    { audioId: "nudge_listen__toto",    textHi: "ध्यान से सुनो।",                  displayHi: "ध्यान से सुनो 👂" },
  ],
};

export function pickPraiseLine(speaker: SpeakerCharacter): { audioId: string; textHi: string; displayHi: string } {
  const pool = PRAISE_LINES[speaker];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function pickRetryLine(speaker: SpeakerCharacter): { audioId: string; textHi: string; displayHi: string } {
  const pool = RETRY_LINES[speaker];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function pickPraiseAudioId(speaker: SpeakerCharacter): string {
  return pickPraiseLine(speaker).audioId;
}

export function pickRetryAudioId(speaker: SpeakerCharacter): string {
  return pickRetryLine(speaker).audioId;
}

/** Spoken line when a sub-level completes — index matches completed sublevelIndex. */
const RESTORE_LINES: { audioId: string; textHi: string }[] = [
  { audioId: "restore_color",     textHi: "वाह! रंग वापस आ गए!" },
  { audioId: "restore_grass",     textHi: "देखो, घास और फूल उग आए!" },
  { audioId: "restore_trees",     textHi: "पेड़ वापस आ गए!" },
  { audioId: "restore_rivers",    textHi: "नदी फिर से बहने लगी!" },
  { audioId: "restore_animals",   textHi: "जानवर लौट आए!" },
  { audioId: "restore_birds_sky", textHi: "पंछी और आसमान — जंगल फिर से जीवित हो गया!" },
];

export function getRestoreLine(completedSublevelIndex: number): { audioId: string; textHi: string } | null {
  return RESTORE_LINES[completedSublevelIndex] ?? null;
}

/** End-of-level celebration — Tina then Toto on the complete screen. */
export const LEVEL_COMPLETE_DIALOGUE: { speaker: SpeakerCharacter; audioId: string; textHi: string }[] = [
  { speaker: "tina", audioId: "level_complete_kamaal__tina", textHi: "कमाल कर दिया!" },
  { speaker: "toto", audioId: "encourage_bahut_badhiya__toto", textHi: "बहुत बढ़िया!" },
];
