// Aksharvan — Content Data Model
// Frontend-owned schema. Data-driven: add new levels via content files only.
// Architecture decision: Level.id is a string, not a literal union, so future
// levels (level-2, level-3...) slot in without any type changes.

export type RestorationStage =
  | "color"
  | "grass"
  | "trees"
  | "rivers"
  | "animals"
  | "birds_sky";

// ─── Card types ───────────────────────────────────────────────────────────────

export type ObjectCard = {
  id: string;
  /** Appwrite storage file ID for the object image */
  image: string;
  /** Hindi name e.g. "बतख" */
  nameHi: string;
  /** Romanized name e.g. "batakh" */
  nameRoman: string;
  /** Appwrite storage file ID for the spoken name audio */
  audioName: string;
};

export type LetterCard = {
  id: string;
  /** Devanagari glyph e.g. "ब" */
  glyph: string;
  /** How to say the sound in Hindi e.g. "ब की आवाज़" */
  soundHi: string;
  /** Romanized sound e.g. "ba" */
  soundRoman: string;
  /** Appwrite storage file ID for the letter-sound audio */
  audioSound: string;
};

export type WordCard = {
  id: string;
  /** Devanagari word e.g. "बस" */
  glyph: string;
  /** Romanized e.g. "bas" */
  roman: string;
  /** Appwrite storage file ID for the whole-word audio */
  audioWord: string;
};

// ─── Exercise types ───────────────────────────────────────────────────────────

export type NameObjectExercise = {
  type: "name_object";
  objectRef: string;
  /** Hindi prompt shown/spoken — e.g. "यह क्या है?" (from content, not hardcoded) */
  promptTextHi: string;
  /** Appwrite storage file ID for spoken prompt audio */
  promptAudio: string;
  options: string[];   // ObjectCard IDs
  correct: string;     // ObjectCard ID
};

export type FirstSoundExercise = {
  type: "first_sound";
  objectRef: string;
  /** e.g. "इसकी पहली आवाज़ क्या है?" */
  promptTextHi: string;
  promptAudio: string;
  options: string[];   // LetterCard IDs
  correct: string;     // LetterCard ID
};

export type BlendExercise = {
  type: "blend";
  letterRefs: string[]; // LetterCard IDs being blended
  /** e.g. "आवाज़ों को जोड़कर नया शब्द क्या बना?" */
  promptTextHi: string;
  promptAudio: string;
  options: string[];   // WordCard IDs
  correct: string;     // WordCard ID
};

export type MatchBuildExercise = {
  type: "match_build";
  availableLetters: string[]; // LetterCard IDs
  targetWords: string[];      // Real dictionary words (bonus sparkle)
  minToPass: number;
  tapInOrder: boolean;
  allowNonWords: boolean;
  promptTextHi: string;
  promptAudio: string;
};

export type MemoryExercise = {
  type: "memory";
  letterPool: string[]; // LetterCard IDs
  revealMs: number;
  maxPairs: number;
  promptTextHi: string;
  promptAudio: string;
};

export type Exercise =
  | NameObjectExercise
  | FirstSoundExercise
  | BlendExercise
  | MatchBuildExercise
  | MemoryExercise;

// ─── Feedback strings — loaded from content, never hardcoded in components ───

export type FeedbackStrings = {
  correct: string[];         // e.g. ["शाबाश!", "बहुत बढ़िया!", "कमाल कर दिया!"]
  retry: string[];           // e.g. ["फिर से कोशिश करो", "बहुत करीब हो"]
  encouragement: string[];   // mid-session motivators
};

// ─── Sub-level & Level ────────────────────────────────────────────────────────

export type Sublevel = {
  index: number;                  // 0..5
  objects: ObjectCard[];          // exactly 2
  letters: LetterCard[];          // exactly 2
  word: WordCard;
  restorationStage: RestorationStage;
  exercises: Exercise[];          // 7, in order per ALfA pedagogy
};

export type Level = {
  /** e.g. "level-1" — string for future extensibility */
  id: string;
  title: string;        // Hindi: "जादूई जंगल"
  titleRoman: string;   // "Jadooi Jungle"
  worldId: string;      // "aksharvan"
  locked: boolean;
  sublevels: Sublevel[];           // 6 for Level 1
  feedback: FeedbackStrings;
};

// ─── World map region (data-driven) ──────────────────────────────────────────

export type WorldRegion = {
  levelId: string;
  nameHi: string;
  nameRoman: string;
  locked: boolean;
  icon: string;
};

export const AKSHARVAN_REGIONS: WorldRegion[] = [
  { levelId: "level-1", nameHi: "जादुई जंगल",      nameRoman: "Jadooi Jungle",      locked: false, icon: "🌳" },
  { levelId: "level-2", nameHi: "इंद्रधनुष झरना", nameRoman: "Rainbow Waterfall",  locked: true,  icon: "🌈" },
  { levelId: "level-3", nameHi: "क्रिस्टल गुफा",  nameRoman: "Crystal Cave",       locked: true,  icon: "💎" },
  { levelId: "level-4", nameHi: "आकाश लोक",        nameRoman: "Sky World",          locked: true,  icon: "☁️" },
];
