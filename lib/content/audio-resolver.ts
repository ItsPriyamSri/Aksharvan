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

const PRAISE_IDS: Record<SpeakerCharacter, string[]> = {
  tina: ["encourage_shabash__tina", "encourage_bahut_badhiya__tina", "encourage_wah__tina"],
  toto: ["encourage_shabash__toto", "encourage_bahut_badhiya__toto", "encourage_wah__toto"],
};

const RETRY_IDS: Record<SpeakerCharacter, string[]> = {
  tina: ["nudge_try_again__tina", "nudge_listen__tina"],
  toto: ["nudge_try_again__toto", "nudge_listen__toto"],
};

export function getScenePromptAudioId(
  kind: ScenePromptKind,
  speaker: SpeakerCharacter,
): string {
  return PROMPT_IDS[kind][speaker];
}

export function pickPraiseAudioId(speaker: SpeakerCharacter): string {
  const pool = PRAISE_IDS[speaker];
  return pool[Math.floor(Math.random() * pool.length)];
}

export function pickRetryAudioId(speaker: SpeakerCharacter): string {
  const pool = RETRY_IDS[speaker];
  return pool[Math.floor(Math.random() * pool.length)];
}
