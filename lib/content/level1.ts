// Aksharvan — Level 1 Content (ALfA Lesson 1)
// 6 sub-levels: बस, पर, अब, घर, तक, चल
// Object images: /objects/{name}.svg (SVG placeholders, swap for real assets)

import type {
  Level, Sublevel, ObjectCard, LetterCard, WordCard,
  Exercise, FeedbackStrings,
} from "@/types/content";

export const LEVEL1_FEEDBACK: FeedbackStrings = {
  correct: [
    "शाबाश!",
    "बहुत बढ़िया!",
    "कमाल कर दिया!",
    "बिल्कुल सही!",
    "वाह! क्या जवाब है!",
  ],
  retry: [
    "फिर से कोशिश करो",
    "बहुत करीब हो!",
    "एक बार और सोचो",
    "हिम्मत रखो!",
    "सोचो… सोचो…",
  ],
  encouragement: [
    "तुम बहुत अच्छा कर रहे हो!",
    "बस थोड़ा और!",
    "मुझे पता है तुम कर सकते हो!",
  ],
};

// ─── Object cards — image points to /objects/{id}.svg ────────────────────────

const batakh:   ObjectCard = { id: "obj-batakh",   image: "/objects/Battakh.JPG",   nameHi: "बतख",    nameRoman: "batakh",   audioName: "audio-batakh-name"   };
const sapera:   ObjectCard = { id: "obj-sapera",   image: "/objects/Sapera.JPG",    nameHi: "सपेरा",  nameRoman: "sapera",   audioName: "audio-sapera-name"   };
const patang:   ObjectCard = { id: "obj-patang",   image: "/objects/Patang.JPG",    nameHi: "पतंग",   nameRoman: "patang",   audioName: "audio-patang-name"   };
const rassi:    ObjectCard = { id: "obj-rassi",    image: "/objects/Rassi.JPG",     nameHi: "रस्सी",  nameRoman: "rassi",    audioName: "audio-rassi-name"    };
const anaar:    ObjectCard = { id: "obj-anaar",    image: "/objects/Anaar.JPG",     nameHi: "अनार",   nameRoman: "anaar",    audioName: "audio-anaar-name"    };
const ghadi:    ObjectCard = { id: "obj-ghadi",    image: "/objects/Ghadi.JPG",     nameHi: "घड़ी",   nameRoman: "ghadi",    audioName: "audio-ghadi-name"    };
const tarbooj:  ObjectCard = { id: "obj-tarbooj",  image: "/objects/Tarbooz.JPG",   nameHi: "तरबूज",  nameRoman: "tarbooj",  audioName: "audio-tarbooj-name"  };
const kachua:   ObjectCard = { id: "obj-kachua",   image: "/objects/Kachhua.JPG",   nameHi: "कछुआ",   nameRoman: "kachua",   audioName: "audio-kachua-name"   };
const chammach: ObjectCard = { id: "obj-chammach", image: "/objects/Chammach.JPG",  nameHi: "चम्मच",  nameRoman: "chammach", audioName: "audio-chammach-name" };
const lattu:    ObjectCard = { id: "obj-lattu",    image: "/objects/Lattu.JPG",     nameHi: "लट्टू",  nameRoman: "lattu",    audioName: "audio-lattu-name"    };

// ─── Letter cards ─────────────────────────────────────────────────────────────

const ba:  LetterCard = { id: "letter-ba",  glyph: "ब",  soundHi: "ब",  soundRoman: "ba",  audioSound: "audio-letter-ba"  };
const sa:  LetterCard = { id: "letter-sa",  glyph: "स",  soundHi: "स",  soundRoman: "sa",  audioSound: "audio-letter-sa"  };
const pa:  LetterCard = { id: "letter-pa",  glyph: "प",  soundHi: "प",  soundRoman: "pa",  audioSound: "audio-letter-pa"  };
const ra:  LetterCard = { id: "letter-ra",  glyph: "र",  soundHi: "र",  soundRoman: "ra",  audioSound: "audio-letter-ra"  };
const a:   LetterCard = { id: "letter-a",   glyph: "अ",  soundHi: "अ",  soundRoman: "a",   audioSound: "audio-letter-a"   };
const gha: LetterCard = { id: "letter-gha", glyph: "घ",  soundHi: "घ",  soundRoman: "gha", audioSound: "audio-letter-gha" };
const ta:  LetterCard = { id: "letter-ta",  glyph: "त",  soundHi: "त",  soundRoman: "ta",  audioSound: "audio-letter-ta"  };
const ka:  LetterCard = { id: "letter-ka",  glyph: "क",  soundHi: "क",  soundRoman: "ka",  audioSound: "audio-letter-ka"  };
const cha: LetterCard = { id: "letter-cha", glyph: "च",  soundHi: "च",  soundRoman: "cha", audioSound: "audio-letter-cha" };
const la:  LetterCard = { id: "letter-la",  glyph: "ल",  soundHi: "ल",  soundRoman: "la",  audioSound: "audio-letter-la"  };

// ─── Word cards ───────────────────────────────────────────────────────────────

const wordBas:  WordCard = { id: "word-bas",  glyph: "बस",  roman: "bas",  audioWord: "audio-word-bas"  };
const wordPar:  WordCard = { id: "word-par",  glyph: "पर",  roman: "par",  audioWord: "audio-word-par"  };
const wordAb:   WordCard = { id: "word-ab",   glyph: "अब",  roman: "ab",   audioWord: "audio-word-ab"   };
const wordGhar: WordCard = { id: "word-ghar", glyph: "घर",  roman: "ghar", audioWord: "audio-word-ghar" };
const wordTak:  WordCard = { id: "word-tak",  glyph: "तक",  roman: "tak",  audioWord: "audio-word-tak"  };
const wordChal: WordCard = { id: "word-chal", glyph: "चल",  roman: "chal", audioWord: "audio-word-chal" };

// All words — used for distractor injection in blend exercise
export const ALL_WORDS: WordCard[] = [wordBas, wordPar, wordAb, wordGhar, wordTak, wordChal];

// ─── Sub-level builder ────────────────────────────────────────────────────────

function buildSublevel(
  index: number,
  obj1: ObjectCard, obj2: ObjectCard,
  letter1: LetterCard, letter2: LetterCard,
  word: WordCard,
  restorationStage: Sublevel["restorationStage"],
  letterPool: LetterCard[],
): Sublevel {
  // Blend distractors: 2 wrong words from other sub-levels
  const distractors = ALL_WORDS.filter((w) => w.id !== word.id).slice(0, 2);

  const exercises: Exercise[] = [
    {
      type: "name_object",
      objectRef:    obj1.id,
      promptTextHi: "यह क्या है?",
      promptAudio:  `audio-prompt-name-${index}-1`,
      options:      [obj1.id, obj2.id],
      correct:      obj1.id,
    },
    {
      type: "first_sound",
      objectRef:    obj1.id,
      promptTextHi: "इसकी पहली आवाज़ क्या है?",
      promptAudio:  `audio-prompt-sound-${index}-1`,
      options:      [letter1.id, letter2.id],
      correct:      letter1.id,
    },
    {
      type: "name_object",
      objectRef:    obj2.id,
      promptTextHi: "यह क्या है?",
      promptAudio:  `audio-prompt-name-${index}-2`,
      options:      [obj1.id, obj2.id],
      correct:      obj2.id,
    },
    {
      type: "first_sound",
      objectRef:    obj2.id,
      promptTextHi: "इसकी पहली आवाज़ क्या है?",
      promptAudio:  `audio-prompt-sound-${index}-2`,
      options:      [letter1.id, letter2.id],
      correct:      letter2.id,
    },
    {
      type:         "blend",
      letterRefs:   [letter1.id, letter2.id],
      promptTextHi: "इन आवाज़ों को जोड़ो — कौन सा शब्द बना?",
      promptAudio:  `audio-prompt-blend-${index}`,
      // Now includes 2 distractors (other words)
      options:      [word.id, ...distractors.map((d) => d.id)],
      correct:      word.id,
    },
    {
      type:             "match_build",
      availableLetters: letterPool.map((l) => l.id),
      targetWords:      [word.glyph],
      minToPass:        1,
      tapInOrder:       true,
      allowNonWords:    true,
      promptTextHi:     `"${word.glyph}" शब्द बनाओ`,
      promptAudio:      `audio-prompt-matchbuild-${index}`,
    },
    {
      type:         "memory",
      letterPool:   letterPool.map((l) => l.id),
      revealMs:     3000,
      maxPairs:     Math.min(letterPool.length, 6),
      promptTextHi: "एक जैसे अक्षर ढूँढो और मिलाओ",
      promptAudio:  `audio-prompt-memory-${index}`,
    },
  ];

  return { index, objects: [obj1, obj2], letters: [letter1, letter2], word, restorationStage, exercises };
}

export const level1: Level = {
  id:         "level-1",
  title:      "जादुई जंगल",
  titleRoman: "Jadooi Jungle",
  worldId:    "aksharvan",
  locked:     false,
  feedback:   LEVEL1_FEEDBACK,
  sublevels: [
    buildSublevel(0, batakh,   sapera,  ba,  sa,  wordBas,  "color",     [ba, sa]),
    buildSublevel(1, patang,   rassi,   pa,  ra,  wordPar,  "grass",     [ba, sa, pa, ra]),
    buildSublevel(2, anaar,    batakh,  a,   ba,  wordAb,   "trees",     [ba, sa, pa, ra, a]),
    buildSublevel(3, ghadi,    rassi,   gha, ra,  wordGhar, "rivers",    [ba, sa, pa, ra, a, gha]),
    buildSublevel(4, tarbooj,  kachua,  ta,  ka,  wordTak,  "animals",   [ba, sa, pa, ra, a, gha, ta, ka]),
    buildSublevel(5, chammach, lattu,   cha, la,  wordChal, "birds_sky", [ba, sa, pa, ra, a, gha, ta, ka, cha, la]),
  ],
};

// ─── Lookup map builders (generic — work for any Level) ──────────────────────

export function buildObjectMap(level: Level): Map<string, ObjectCard> {
  const map = new Map<string, ObjectCard>();
  for (const sl of level.sublevels)
    for (const obj of sl.objects) map.set(obj.id, obj);
  return map;
}

export function buildLetterMap(level: Level): Map<string, LetterCard> {
  const map = new Map<string, LetterCard>();
  for (const sl of level.sublevels)
    for (const letter of sl.letters) map.set(letter.id, letter);
  return map;
}

export function buildWordMap(level: Level): Map<string, WordCard> {
  const map = new Map<string, WordCard>();
  for (const sl of level.sublevels) map.set(sl.word.id, sl.word);
  return map;
}
