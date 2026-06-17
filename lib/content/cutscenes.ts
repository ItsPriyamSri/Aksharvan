import type { CutsceneShot } from "@/components/cutscene/ShotSequencePlayer";
import { WORLD_LEVEL_IDS } from "./registry";

const LEVEL_CUTSCENES: Record<string, CutsceneShot[]> = {
  "level-1": [
    {
      id: "l1-s1",
      imageSrc:  "/characters/Tina_Toto_Puppet.png",
      imageAlt:  "टीना और टोटो",
      captionHi: "जंगल को बचाने के लिए कुछ सवालों के जवाब दो!",
      kenBurns:  "zoom-in",
      audioId:   "story_hook_tina",
    },
    {
      id: "l1-s2",
      imageSrc:  "/characters/Tina_Toto_Puppet.png",
      imageAlt:  "टीना और टोटो",
      captionHi: "चलो सीखते हैं और जंगल को फिर से हरा-भरा बनाते हैं!",
      kenBurns:  "pan-right",
      audioId:   "story_hook_toto",
    },
    {
      id: "l1-s3",
      imageSrc:  "/characters/Tina_Puppet.png",
      imageAlt:  "टीना",
      captionHi: "मैं हूँ टीना — मेरे साथ चलो जादुई जंगल में!",
      kenBurns:  "zoom-out",
      audioId:   "",
    },
    {
      id: "l1-s4",
      imageSrc:  "/characters/Toto_Puppet.png",
      imageAlt:  "टोटो",
      captionHi: "और मैं हूँ टोटो — मिलकर हम जंगल को बचाएंगे!",
      kenBurns:  "pan-left",
      audioId:   "",
    },
  ],
};

const FALLBACK_SHOTS: CutsceneShot[] = [
  { id:"fallback-1", imageSrc:"/characters/Tina_Toto_Puppet.png", imageAlt:"अक्षरवन",
    captionHi:"नया रोमांच शुरू होने वाला है!", kenBurns:"zoom-in" },
];

export function getLevelCutscene(levelId: string): CutsceneShot[] {
  return LEVEL_CUTSCENES[levelId] ?? FALLBACK_SHOTS;
}
