# Aksharvan — FRONTEND PLAN (Prototype: Level 1)

> **Audience:** Claude Code. This is a build brief. Build in the order in §11. §4 (Shared API Contract) and §5 (Content Data Model) mirror the **backend plan** — keep them identical.
> **Stack note:** this app uses **Next.js (App Router)** for the frontend and **Appwrite** for the backend. The Appwrite calls below match the backend plan's §3 contract exactly.
> **Scope:** Level 1 (Jadooi Jungle) only. Other levels appear on the map but are locked.

---

## 1. What you are building

A mobile-first, voice-enabled PWA that teaches Hindi letter-sounds to children (4–10) through a "heal the magical forest" story. The child logs in, watches a cutscene, opens a world map, enters Jadooi Jungle, and completes **6 letter-pair sub-levels**; each completion visibly restores one layer of the forest. Two guide characters, **Tina** and **Toto**, narrate in Hindi.

**Non-negotiables:** runs on low-end Android over weak networks; spoken instructions everywhere (kids are pre-literate); polished microinteractions; voice answering present from day one with an always-visible tap fallback; flow auto-advances and the mic auto-arms the moment narration ends.

---

## 2. Stack

- **Next.js 14+ (App Router) + TypeScript** — file-based routing, code splitting, `next/font`, easy deploy.
- **Tailwind CSS** (mobile-first, responsive)
- **Framer Motion** — transitions and microinteractions (spring-based)
- **lottie-react** — character idles, celebrations, restoration reveals
- **Howler.js** — all audio (handles mobile autoplay unlock, audio sprites)
- **`appwrite` (Web SDK)** — auth, profile/progress documents, storage URLs, Function calls (see backend plan)
- **PWA via `@serwist/next` (Serwist)** — service-worker precache + runtime caching (the App-Router-friendly successor to next-pwa/Workbox)
- **`next/font`** — load the Devanagari fonts (see §3)
- State: React Context + hooks (no Redux needed at this scale)

**Architecture notes (App Router):** this is a highly interactive client app — all screens and interactive components are **Client Components** (`"use client"`). The root `layout.tsx` may stay a Server Component but wraps everything in a client `AppProviders` (Appwrite client, auth/profile context, audio/Howler context, current-speaker context). Route guards run **client-side** (check the Appwrite session, redirect with `next/navigation`).

**Deployment:** recommended `next.config` with **`output: 'export'`** (fully static) — best for CDN/edge delivery on weak networks, cheap hosting, and pairs cleanly with the service worker. We need no Next server features (the backend is Appwrite; learning content is bundled). With static export: set `images: { unoptimized: true }` (we use Appwrite's image transforms instead — see §10), and give the dynamic level route a `generateStaticParams` returning `[{ levelId: 'level-1' }]`. A normal Vercel deploy also works if you prefer.

---

## 3. Design system (build to this — do not produce a generic kids' template)

**Direction:** "enchanted storybook at dusk." The world is losing its light; the child brings light back. The signature element is **fireflies of light** — small glowing motes that gather and burst on every correct answer and stream into the forest as it heals. Spend the boldness there; keep everything else calm and rounded.

**Palette (CSS variables):**
```
--bg-twilight:   #20243F   /* deep dusk base for menu/map */
--bg-forest-dark:#16241C   /* decolorized forest start state */
--surface:       #FFF7E8   /* warm parchment cards/modals */
--forest:        #2E7D5B   /* primary green */
--forest-deep:   #1F5C44
--magic:         #6B4E9E   /* enchantment purple */
--firefly:       #FFC84A   /* SIGNATURE accent / light motes */
--firefly-glow:  #FFE08A
--tina:          #F2789A   /* Tina cue colour (pink) */
--toto:          #4FB0E0   /* Toto cue colour (blue) */
--success:       #4CAF7D
--ink:           #2A2435   /* text on light surfaces */
```
Use Tina/Toto cue colours to signal *who is speaking* (a glow/ring around the active character), never as decoration.

**Typography — load via `next/font/google` with the `latin` + `devanagari` subsets so Hindi renders correctly:**
- **Display / character speech:** `Baloo 2` — rounded, chunky, friendly. Use with restraint for big moments.
- **Body / UI:** `Mukta` — clean, highly legible Devanagari.
- **Letter tiles (the अक्षर glyphs):** `Tiro Devanagari Hindi` — clear, well-formed conjuncts for the learning content itself.
Set a deliberate scale. Letter tiles are large and the visual hero of exercises.

**Motion:** spring physics (Framer Motion), gentle bounce on taps, scale-up + firefly burst on success. Ambient slow-drifting motes on menu/map. **Respect `prefers-reduced-motion`** (swap motion for simple fades). Animation must degrade gracefully on low-end devices — keep simultaneous animations few.

**Components quality floor:** large touch targets (min 56px), visible keyboard focus, high contrast, everything reachable one-handed on a phone. Copy is in Hindi, sentence case, plain verbs; buttons say what they do.

---

## 4. SHARED API CONTRACT (Appwrite — matches backend plan §3)

Configure the Appwrite **Web SDK** `Client` with the Appwrite **endpoint** + **projectId** (env vars). Auth and data go through the SDK; custom logic goes through **Function executions**.

**Auth — Appwrite Account API:**
- Signup / first login (phone OTP):
  - `account.createPhoneToken(ID.unique(), phone)` → sends SMS code; capture returned `userId`.
  - `account.createSession(userId, otpCode)` → verifies the code, creates a session.
  - (For an existing user, pass their id to `createPhoneToken` instead of `ID.unique()`.)
- The SDK persists/refreshes the session, so returning users usually skip login.
- Logout: `account.deleteSession('current')`.

**Functions (call via `functions.createExecution(functionId, JSON.stringify(body), ...)`):**

| Function | Request body | Response | Notes |
|---|---|---|---|
| `set-pin` | `{ pin: "1234" }` | `{ ok: true }` | sets a 4-digit PIN on the profile |
| `login-with-pin` *(no session)* | `{ phone, pin }` | `{ userId, secret }` | then call `account.createSession(userId, secret)` to log in |
| `asr-recognize` | `{ audioBase64, mimeType, expected: string[], exerciseId }` | `{ matched: boolean, confidence: number, transcript: string }` | the voice-answer check |

**Databases (via the Web SDK — `databases.getDocument/createDocument/updateDocument`; each document is protected by per-document permissions so users touch only their own):**

`profiles` — **document id = the account `$id`** (1:1):
```
parent_phone: string, language: 'hi', child_age: int,
avatar_variant: 0|1|2, pin_hash?: string, created_at
```
`progress` — **document id = `${userId}_${levelId}`** (natural upsert):
```
profile_id: string, level_id: string, state: string(JSON), updated_at
```
On create, set permissions: `[Permission.read(Role.user(userId)), Permission.update(Role.user(userId)), Permission.delete(Role.user(userId))]`.

`state` is stored as a **JSON string** (Appwrite has no JSON type) — `JSON.stringify` on write, `JSON.parse` on read. Shape (frontend-owned):
```json
{ "sublevels": [ { "index": 0, "status": "completed", "exercisesDone": 7 } ], "restorationStage": 1 }
```

**Static assets (Appwrite Storage):** images, Lottie JSON, and **all narration audio clips** are files referenced by the `audioName`/`image` ids in the content JSON, resolved to URLs via `storage.getFileView(bucketId, fileId)` (or `getFilePreview` for downscaled images). TTS is **never** called at runtime — clips are pre-generated (backend §7).

---

## 5. Content data model (lives in the frontend repo as a bundled JSON/TS module; ship Level 1 seed)

Bundled with the app for offline/low-bandwidth (imported as a module; works with static export). Schema shared with content + backend teams.

```ts
type Level = {
  id: "level-1";
  title: "जादूई जंगल";        // Hindi
  titleRoman: "Jadooi Jungle";
  worldId: "aksharvan";
  locked: false;
  sublevels: Sublevel[];       // 6
};

type Sublevel = {
  index: number;               // 0..5
  objects: ObjectCard[];       // 2
  letters: LetterCard[];       // 2
  word: WordCard;              // blended word
  restorationStage: "color"|"grass"|"trees"|"rivers"|"animals"|"birds_sky";
  exercises: Exercise[];       // 7, generated from 5 types — see §8
};

type ObjectCard = { id:string; image:string; nameHi:string; nameRoman:string; audioName:string };
type LetterCard = { id:string; glyph:string; soundHi:string; soundRoman:string; audioSound:string };
type WordCard   = { id:string; glyph:string; roman:string; audioWord:string };

type Exercise =
  | { type:"name_object"; objectRef:string; promptAudio:string; options:string[]; correct:string }
  | { type:"first_sound"; objectRef:string; promptAudio:string; options:string[]; correct:string }
  | { type:"blend";       letterRefs:string[]; promptAudio:string; options:string[]; correct:string }
  | { type:"match_build"; availableLetters:string[]; targetWords:string[]; minToPass:number; tapInOrder:true; allowNonWords:true; promptAudio:string }
  | { type:"memory";      letterPool:string[]; revealMs:3000; maxPairs:6; promptAudio:string };
```

**Level 1 seed content (from the ALfA Lesson-1 book — verify spellings against the page):**

| SL | Object 1 → Letter | Object 2 → Letter | Word | Restoration |
|----|----|----|----|----|
| 0 | बतख (batakh) → ब (ba) | सपेरा (sapera) → स (sa) | बस (bas) | color |
| 1 | पतंग (patang) → प (pa) | रस्सी (rassi) → र (ra) | पर (par) | grass |
| 2 | अनार (anaar) → अ (a) | बतख (batakh) → ब (ba) | अब (ab) | trees |
| 3 | घड़ी (ghadi) → घ (gha) | रस्सी (rassi) → र (ra) | घर (ghar) | rivers |
| 4 | तरबूज (tarbooj) → त (ta) | कछुआ (kachua) → क (ka) | तक (tak) | animals |
| 5 | चम्मच (chammach) → च (cha) | लट्टू (lattu) → ल (la) | चल (chal) | birds_sky |

Cumulative letters unlock in this order: ब, स, प, र, अ, घ, त, क, च, ल (10 total — drives the memory pool).

---

## 6. Routes & screens (Next.js App Router)

```
app/
  layout.tsx                          root: next/font, AppProviders (client), PWA, audio-unlock gate
  page.tsx                            entry: redirect to /menu if session, else /login
  login/page.tsx                      Step 1 — phone + OTP, age slider, language locked to Hindi
  menu/page.tsx                       Step 2 — Play, Settings; background + animated Tina & Toto
  settings/page.tsx                   change age/language
  intro/page.tsx                      Step 3 — world intro cutscene (skippable)
  map/page.tsx                        Step 4 — Aksharvan map; Jadooi Jungle active, rest locked
  level/[levelId]/page.tsx            Step 5 — level backstory cutscene → then play
  level/[levelId]/play/page.tsx       Step 6 — sub-level loop (exercise engine) + restoration
  level/[levelId]/complete/page.tsx   Step 7 — celebration
```

For static export, add `generateStaticParams` to the `[levelId]` route returning `[{ levelId: 'level-1' }]`. **Route guards** are client-side: a guard in `AppProviders`/per-page checks `account.get()`; if unauthenticated → `router.replace('/login')`. After login, resume at the furthest unlocked point using the `progress` document.

---

## 7. Screen specs

**Login:** parent phone field → OTP input (`createPhoneToken` → `createSession`). Age = slider 4–10 → sets `avatar_variant` (4–5→0, 6–7→1, 8–10→2). Language pill shows "हिंदी" (locked). Every field has spoken + iconographic labels. On submit: create the `profiles` document (id = account `$id`) with per-user permissions, and init the `progress` document.

**Menu:** full-bleed background art; Tina & Toto present with Lottie idle loops (blink/sway). Big **Play** (खेलें) and **Settings** (सेटिंग्स). Ambient firefly motes drift. First user gesture unlocks Howler audio context; a soft welcome line plays.

**Map (Aksharvan):** colourful game-style map with **separate clickable regions** as levels. Region 1 = Jadooi Jungle (active, glowing). Regions 2+ (e.g. Rainbow Waterfall) rendered greyed/locked with a small lock; tapping shows "जल्द आ रहा है" (coming soon). Tapping Jadooi Jungle → `/level/level-1`.

**Cutscene player** (shared client component for `/intro` and the level backstory): plays a sequence of illustrated shots with narration audio and gentle motion (Ken-Burns pan/zoom or Lottie). **Skip** button always visible. Fully Hindi. (Asset/script source: content plan.)

**Sub-level play (the engine):** runs the 7 exercises in order (§8), then plays the restoration animation for that sub-level's stage, then advances to the next sub-level. After SL5 (index 5) → `/level/level-1/complete`.

---

## 8. Exercise engine (the core — build a generic player driven by the content JSON)

A sub-level = 7 exercises generated from **5 types** (the first two repeat per object):

| Step | Type | Spoken prompt (Hindi) | Input | Pass |
|--|--|--|--|--|
| 1 | `name_object` (obj 1) | "यह क्या है?" + image | tap a picture **or** speak | matches object name |
| 2 | `first_sound` (obj 1) | "इसकी पहली आवाज़ क्या है?" | tap a letter **or** speak | matches letter sound |
| 3 | `name_object` (obj 2) | "यह क्या है?" + image | tap **or** speak | matches object name |
| 4 | `first_sound` (obj 2) | "इसकी पहली आवाज़ क्या है?" | tap **or** speak | matches letter sound |
| 5 | `blend` | "इन्हें जोड़ें — कौन सा शब्द बना?" | tap **or** speak | matches blended word |
| 6 | `match_build` | "इन अक्षरों से शब्द बनाओ" | **tap letters in order** to build words | build `minToPass` words (default 3); non-words allowed; the pair's real words give bonus sparkle |
| 7 | `memory` | "एक जैसे अक्षर ढूँढो" | flip tiles to find matching pairs | all pairs found |

**Memory game rules (confirmed):** grid is **dynamic**, built from the **cumulative letters unlocked so far** (2 after SL0 → up to 10 after SL5). Each letter appears twice (pairs). **Cap at 6 pairs (12 tiles); when the pool exceeds 6, randomly sample 6 letters per round.** On round start, reveal all tiles for **3 seconds**, then flip face-down. Tapping a tile reveals it; a correct pair **stays revealed permanently**; a mismatch flips back after a beat.

**Match-build rules (confirmed):** tap letters **in order** to fill word slots. Words **need not be real** (e.g. "सप" is fine — sound practice). `minToPass` default 3; real dictionary words trigger extra celebration.

**Universal behaviours (apply to every exercise):**
- **Auto-advance:** on a correct answer, play the encouragement clip + firefly burst, then automatically move to the next step. No manual "next."
- **Mic auto-arms:** if the exercise `allowVoice` (E1–E5 do), the mic turns on with a visible listening pulse **the instant the prompt narration finishes**. Tap options remain fully usable simultaneously.
- **Tap fallback always present.** Voice is an enhancement layered on top, never a gate.
- **Gentle retry:** wrong answer → no harsh red/X. Re-narrate, softly highlight the right region, let them try; after 2 misses, reveal and let them tap to continue. This age must not feel punished.
- **Encouragement:** randomized from {"शाबाश!", "बहुत बढ़िया!", "वाह!"} (audio clips), with character animation. Tina and Toto **alternate** as the asker across exercises/sub-levels (track whose turn; show the speaker glow in their cue colour).
- Persist `progress` after each completed sub-level (and ideally each exercise) via `databases.updateDocument` (stringify `state`).

---

## 9. Voice integration

**Narration (TTS) — playback only.** All prompts/encouragement are **pre-generated audio files** referenced by `audioName` in the content JSON, resolved to Appwrite Storage URLs. Load via Howler; preload the current sub-level's clips. Never call a TTS API at runtime.

**Answering (ASR) — record → Function → match.** When the mic arms: record a short clip (MediaRecorder, ~2–4s, auto-stop on silence or a max timeout), base64-encode, call the `asr-recognize` Function with the exercise's `expected` strings. It returns `{ matched, confidence, transcript }`. On `matched` → success path; on low confidence/no match → gentle nudge to try again or tap. Show clear mic states: idle → listening (pulse) → thinking → result. Always keep tap options live as the fallback.

**Audio unlock:** mobile browsers block audio until a user gesture — unlock Howler on the first tap (the Play button / "tap to start" gate).

---

## 10. PWA, offline & low-bandwidth (first-class requirement)

- **`@serwist/next`** service worker: precache the app shell; runtime-cache images/audio/Lottie (cache-first) so the app works after first load and on weak networks.
- Lazy-load per level (App Router code-splits per route); only fetch Level 1 assets up front.
- **Images:** request downscaled, modern formats from Appwrite via `getFilePreview` (width + `output=webp`/`avif`, quality). UI art and letter tiles as **SVG**/typographic; characters/animations as **Lottie JSON** (tiny). With static export, set `images.unoptimized: true` and use an Appwrite-URL `<img>` wrapper (or a custom `next/image` loader that builds the `getFilePreview` URL).
- **Audio:** expect compressed mono **Opus/AAC (~24–32 kbps)** clips from the backend pipeline.
- Keep concurrent animations low; test on a throttled connection and a low-end device profile.
- Web App Manifest + "Add to Home Screen" so it installs like an app.

---

## 11. Build order (epics → stories; hours rough)

**E1 — Project & shell** · *~7h* — Next.js (App Router) + TS + Tailwind scaffold; `output:'export'` config + `images.unoptimized`; design tokens as CSS vars + Tailwind theme; `next/font` for the 3 Devanagari fonts; `@serwist/next` PWA; Appwrite client (endpoint + projectId) + env; `AppProviders`; Howler audio-unlock gate.

**E2 — Auth & profile** · *~8h* — `/login` (`createPhoneToken`→`createSession`, age slider, locked language); create/read the `profiles` document; client route guards + resume-from-progress; `/settings`.

**E3 — Menu & map** · *~8h* — `/menu` with background + Lottie Tina/Toto + ambient motes + Play/Settings; `/map` with clickable Jadooi Jungle (active) and locked regions.

**E4 — Cutscene player** · *~6h* — generic shot-sequence client component with narration sync, motion, skip; wire `/intro` and the level backstory from content.

**E5 — Exercise engine core** · *~14h* — generic player reading content JSON; E1–E5 (name_object, first_sound, blend) with tap input, auto-advance, gentle retry, speaker alternation, encouragement.

**E6 — Match-build (E6)** · *~8h* — tap-in-order word builder; word slots; non-word allowed; minToPass; real-word bonus.

**E7 — Memory game (E7)** · *~8h* — dynamic grid from cumulative letters; 3s reveal; permanent pair reveal; sample-6 when large.

**E8 — Voice answering** · *~10h* — MediaRecorder capture, auto-arm on narration end, mic UI states, `asr-recognize` Function call, match handling + fallback.

**E9 — Restoration & celebration** · *~8h* — layered forest component; reveal stage on each sub-level complete (color→grass→trees→rivers→animals→birds_sky) with firefly-stream animation; `/level/level-1/complete`.

**E10 — Progress sync** · *~4h* — write/read the `progress` document (per-account, cross-device; stringify/parse `state`); resume correctly.

**E11 — Polish & QA pass** · *~10h* — microinteractions, reduced-motion, responsive sweep, low-bandwidth/low-end testing, bug fixing against §12.

---

## 12. Acceptance criteria (definition of done)

- A new user signs up by phone+OTP, sets age, lands on the menu — all without reading anything (audio guides them).
- Cutscenes play in Hindi and are skippable.
- Map shows Jadooi Jungle active and other regions clearly locked.
- All 6 sub-levels run the full 7-step sequence; each completion restores the correct forest layer; finishing all 6 reaches the celebration.
- Mic auto-arms exactly when narration ends; speaking the right answer advances; tapping always works as fallback.
- Match-build accepts non-words and passes at `minToPass`; memory game reveals 3s, keeps matched pairs, samples 6 when large.
- Progress persists per account (the `progress` document) and resumes on a second device.
- Installs as a PWA; usable after first load on a throttled connection; no visible jank on a low-end phone; `prefers-reduced-motion` respected.

---

## 13. Resolved decisions (baked in above)

1. **7 steps per pair** = 5 exercise types, with name_object + first_sound repeated for each of the 2 objects.
2. **Match-build = tap in order**, non-words allowed, `minToPass` default 3.
3. **Memory:** dynamic grid from cumulative letters, randomize/sample-6 when large, 3s reveal, matched pairs stay revealed.
4. **Voice is in the prototype** (TTS playback + ASR answering) with a permanent tap fallback.
5. **Restoration order:** color → grass/flowers → trees → rivers → animals → birds/sky.
6. **Auth (Appwrite):** phone OTP for signup; returning users use the persistent session or phone+PIN (`login-with-pin` → `createSession`).
7. **Progress is per-account, cross-device** (one `progress` document per profile per level).
8. **Visual:** colourful clickable game map (Jadooi Jungle, then Rainbow Waterfall, …); guides use the existing full-body Tina/Toto art (puppet styling deferred — see content plan).
9. **Framework:** Next.js App Router, mostly Client Components, static export for low-bandwidth CDN delivery.