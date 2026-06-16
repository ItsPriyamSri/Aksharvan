export interface ObjectCard {
  id: string;
  nameHi: string;
  nameRoman: string;
  letter: string;
  soundHi: string;
  soundRoman: string;
  objAudio: string;
  soundAudio: string;
}

export interface NameObjectExercise {
  type: 'name_object';
  speaker: 'tina' | 'toto';
  promptAudio: string;
  object: ObjectCard;
  correct: string;
  expected: string[];
}

export interface FirstSoundExercise {
  type: 'first_sound';
  speaker: 'tina' | 'toto';
  promptAudio: string;
  object: ObjectCard;
  correct: string;
  expected: string[];
}

export interface BlendExercise {
  type: 'blend';
  speaker: 'tina' | 'toto';
  promptAudio: string;
  obj1: ObjectCard;
  obj2: ObjectCard;
  wordGlyph: string;
  wordRoman: string;
  wordAudio: string;
  correct: string;
  expected: string[];
}

export interface MatchBuildExercise {
  type: 'match_build';
  speaker: 'tina' | 'toto';
  promptAudio: string;
  availableLetters: string[];
  minToPass: number;
}

export interface MemoryExercise {
  type: 'memory';
  speaker: 'tina' | 'toto';
  promptAudio: string;
  letterPool: string[];
}

export type Exercise =
  | NameObjectExercise
  | FirstSoundExercise
  | BlendExercise
  | MatchBuildExercise
  | MemoryExercise;

export interface Sublevel {
  id: string;
  index: number;
  obj1: ObjectCard;
  obj2: ObjectCard;
  wordGlyph: string;
  wordRoman: string;
  wordAudio: string;
  restorationKey: string;
  exercises: Exercise[];
}

export interface Level {
  id: string;
  sublevels: Sublevel[];
}

// ---------------------------------------------------------------------------
// Object card definitions
// ---------------------------------------------------------------------------


const batakh: ObjectCard = {
  id: 'batakh',
  nameHi: 'बतख',
  nameRoman: 'batakh',
  letter: 'ब',
  soundHi: 'ब',
  soundRoman: 'ba',
  objAudio: 'obj_batakh',
  soundAudio: 'sound_ba',
};

const sapera: ObjectCard = {
  id: 'sapera',
  nameHi: 'सपेरा',
  nameRoman: 'sapera',
  letter: 'स',
  soundHi: 'स',
  soundRoman: 'sa',
  objAudio: 'obj_sapera',
  soundAudio: 'sound_sa',
};

const patang: ObjectCard = {
  id: 'patang',
  nameHi: 'पतंग',
  nameRoman: 'patang',
  letter: 'प',
  soundHi: 'प',
  soundRoman: 'pa',
  objAudio: 'obj_patang',
  soundAudio: 'sound_pa',
};

const rassi: ObjectCard = {
  id: 'rassi',
  nameHi: 'रस्सी',
  nameRoman: 'rassi',
  letter: 'र',
  soundHi: 'र',
  soundRoman: 'ra',
  objAudio: 'obj_rassi',
  soundAudio: 'sound_ra',
};

const anaar: ObjectCard = {
  id: 'anaar',
  nameHi: 'अनार',
  nameRoman: 'anaar',
  letter: 'अ',
  soundHi: 'अ',
  soundRoman: 'a',
  objAudio: 'obj_anaar',
  soundAudio: 'sound_a',
};

const ghadi: ObjectCard = {
  id: 'ghadi',
  nameHi: 'घड़ी',
  nameRoman: 'ghadi',
  letter: 'घ',
  soundHi: 'घ',
  soundRoman: 'gha',
  objAudio: 'obj_ghadi',
  soundAudio: 'sound_gha',
};

const tarbooj: ObjectCard = {
  id: 'tarbooj',
  nameHi: 'तरबूज',
  nameRoman: 'tarbooj',
  letter: 'त',
  soundHi: 'त',
  soundRoman: 'ta',
  objAudio: 'obj_tarbooj',
  soundAudio: 'sound_ta',
};

const kachua: ObjectCard = {
  id: 'kachua',
  nameHi: 'कछुआ',
  nameRoman: 'kachua',
  letter: 'क',
  soundHi: 'क',
  soundRoman: 'ka',
  objAudio: 'obj_kachua',
  soundAudio: 'sound_ka',
};

const chammach: ObjectCard = {
  id: 'chammach',
  nameHi: 'चम्मच',
  nameRoman: 'chammach',
  letter: 'च',
  soundHi: 'च',
  soundRoman: 'cha',
  objAudio: 'obj_chammach',
  soundAudio: 'sound_cha',
};

const lattu: ObjectCard = {
  id: 'lattu',
  nameHi: 'लट्टू',
  nameRoman: 'lattu',
  letter: 'ल',
  soundHi: 'ल',
  soundRoman: 'la',
  objAudio: 'obj_lattu',
  soundAudio: 'sound_la',
};

// ---------------------------------------------------------------------------
// Helpers to build the 7 exercises per sub-level
// ---------------------------------------------------------------------------

function buildExercises(
  obj1: ObjectCard,
  obj2: ObjectCard,
  wordGlyph: string,
  wordRoman: string,
  wordAudio: string,
  availableLetters: string[],
  letterPool: string[],
  startSpeaker: 'tina' | 'toto',
): Exercise[] {
  const speakers: Array<'tina' | 'toto'> = ['tina', 'toto'];
  const sp = (i: number): 'tina' | 'toto' => {
    const base = startSpeaker === 'tina' ? 0 : 1;
    return speakers[(base + i) % 2];
  };

  const nameObjectExpected = (obj: ObjectCard): string[] => [
    obj.nameHi,
    obj.nameRoman,
    obj.nameHi + 'है',
    obj.nameHi + ' है',
  ];

  const firstSoundExpected = (obj: ObjectCard): string[] => [
    obj.letter,
    obj.soundRoman,
  ];

  const blendExpected: string[] = [wordGlyph, wordRoman];

  const exercises: Exercise[] = [
    {
      type: 'name_object',
      speaker: sp(0),
      promptAudio: `prompt_yeh_kya_hai__${sp(0)}`,
      object: obj1,
      correct: obj1.nameHi,
      expected: nameObjectExpected(obj1),
    } satisfies NameObjectExercise,
    {
      type: 'first_sound',
      speaker: sp(1),
      promptAudio: `prompt_pehli_awaz__${sp(1)}`,
      object: obj1,
      correct: obj1.letter,
      expected: firstSoundExpected(obj1),
    } satisfies FirstSoundExercise,
    {
      type: 'name_object',
      speaker: sp(2),
      promptAudio: `prompt_yeh_kya_hai__${sp(2)}`,
      object: obj2,
      correct: obj2.nameHi,
      expected: nameObjectExpected(obj2),
    } satisfies NameObjectExercise,
    {
      type: 'first_sound',
      speaker: sp(3),
      promptAudio: `prompt_pehli_awaz__${sp(3)}`,
      object: obj2,
      correct: obj2.letter,
      expected: firstSoundExpected(obj2),
    } satisfies FirstSoundExercise,
    {
      type: 'blend',
      speaker: sp(4),
      promptAudio: `prompt_jodkar__${sp(4)}`,
      obj1,
      obj2,
      wordGlyph,
      wordRoman,
      wordAudio,
      correct: wordGlyph,
      expected: blendExpected,
    } satisfies BlendExercise,
    {
      type: 'match_build',
      speaker: sp(5),
      promptAudio: `prompt_match_build__${sp(5)}`,
      availableLetters,
      minToPass: 3,
    } satisfies MatchBuildExercise,
    {
      type: 'memory',
      speaker: sp(6),
      promptAudio: `prompt_memory__${sp(6)}`,
      letterPool,
    } satisfies MemoryExercise,
  ];

  return exercises;
}

// ---------------------------------------------------------------------------
// Sub-level data
// ---------------------------------------------------------------------------

const sublevel0: Sublevel = {
  id: 'sl-0',
  index: 0,
  obj1: batakh,
  obj2: sapera,
  wordGlyph: 'बस',
  wordRoman: 'bas',
  wordAudio: 'word_bas',
  restorationKey: 'color',
  exercises: buildExercises(
    batakh,
    sapera,
    'बस',
    'bas',
    'word_bas',
    ['ब', 'स'],
    ['ब', 'स'],
    'tina',
  ),
};

const sublevel1: Sublevel = {
  id: 'sl-1',
  index: 1,
  obj1: patang,
  obj2: rassi,
  wordGlyph: 'पर',
  wordRoman: 'par',
  wordAudio: 'word_par',
  restorationKey: 'grass',
  exercises: buildExercises(
    patang,
    rassi,
    'पर',
    'par',
    'word_par',
    ['ब', 'स', 'प', 'र'],
    ['ब', 'स', 'प', 'र'],
    'toto',
  ),
};

const sublevel2: Sublevel = {
  id: 'sl-2',
  index: 2,
  obj1: anaar,
  obj2: batakh,
  wordGlyph: 'अब',
  wordRoman: 'ab',
  wordAudio: 'word_ab',
  restorationKey: 'trees',
  exercises: buildExercises(
    anaar,
    batakh,
    'अब',
    'ab',
    'word_ab',
    ['ब', 'स', 'प', 'र', 'अ'],
    ['ब', 'स', 'प', 'र', 'अ'],
    'tina',
  ),
};

const sublevel3: Sublevel = {
  id: 'sl-3',
  index: 3,
  obj1: ghadi,
  obj2: rassi,
  wordGlyph: 'घर',
  wordRoman: 'ghar',
  wordAudio: 'word_ghar',
  restorationKey: 'rivers',
  exercises: buildExercises(
    ghadi,
    rassi,
    'घर',
    'ghar',
    'word_ghar',
    ['ब', 'स', 'प', 'र', 'अ', 'घ'],
    ['ब', 'स', 'प', 'र', 'अ', 'घ'],
    'toto',
  ),
};

const sublevel4: Sublevel = {
  id: 'sl-4',
  index: 4,
  obj1: tarbooj,
  obj2: kachua,
  wordGlyph: 'तक',
  wordRoman: 'tak',
  wordAudio: 'word_tak',
  restorationKey: 'animals',
  exercises: buildExercises(
    tarbooj,
    kachua,
    'तक',
    'tak',
    'word_tak',
    ['ब', 'स', 'प', 'र', 'अ', 'घ', 'त', 'क'],
    ['ब', 'स', 'प', 'र', 'अ', 'घ', 'त', 'क'],
    'tina',
  ),
};

const sublevel5: Sublevel = {
  id: 'sl-5',
  index: 5,
  obj1: chammach,
  obj2: lattu,
  wordGlyph: 'चल',
  wordRoman: 'chal',
  wordAudio: 'word_chal',
  restorationKey: 'birds_sky',
  exercises: buildExercises(
    chammach,
    lattu,
    'चल',
    'chal',
    'word_chal',
    ['ब', 'स', 'प', 'र', 'अ', 'घ', 'त', 'क', 'च', 'ल'],
    ['ब', 'स', 'प', 'र', 'अ', 'घ', 'त', 'क', 'च', 'ल'],
    'toto',
  ),
};

export const level1: Level = {
  id: 'level-1',
  sublevels: [sublevel0, sublevel1, sublevel2, sublevel3, sublevel4, sublevel5],
};
