# Aksharvan — CONTENT & ASSET PLAN (Prototype: Level 1)

> **Audience:** Content writer, graphic designer, and audio lead. This plan defines **what assets exist, what to create, and how they assemble** into the story, the map, the cutscenes, and the restoration of Jadooi Jungle. Every asset id here must match the ids the frontend uses in its content JSON and the backend uses in the TTS pipeline — the naming convention in §9 is the contract.
> **Scope:** Level 1 (Jadooi Jungle) only. Level 2+ regions appear on the map but are locked/greyed.

---

## 1. Visual style direction

**Mood:** "enchanted storybook at dusk." Aksharvan is a magical world that has lost its light and colour; the child brings them back. Warm, rounded, hand-illustrated, high-saturation but not harsh. The recurring motif is **fireflies / motes of light** — they gather and burst on success and stream into the forest as it heals. This motif is the through-line across menu, cutscenes, exercises, and restoration.

**Palette (match the frontend tokens):** deep twilight (#20243F) and forest-dark (#16241C) backgrounds; warm parchment (#FFF7E8) for cards; forest greens (#2E7D5B / #1F5C44); enchantment purple (#6B4E9E); firefly gold (#FFC84A / glow #FFE08A) as the signature accent. Tina cue colour pink (#F2789A), Toto cue colour blue (#4FB0E0) — used to show who is speaking, not as decoration.

**Typography (in-app, not baked into images):** display `Baloo 2`, body `Mukta`, and the अक्षर letter tiles rendered in `Tiro Devanagari Hindi`. **Letter tiles are typographic (drawn from the font in-app), so they are NOT image assets** — this saves bandwidth and keeps glyphs crisp at any size.

**The Aksharvan map** should read like a friendly game world map with **distinct, clickable regions** as levels — Region 1 **Jadooi Jungle (जादूई जंगल)** active and glowing; later regions (e.g. **Rainbow Waterfall / इंद्रधनुष झरना**, then a sea region, a sky/space region) drawn but greyed with a small lock and "जल्द आ रहा है" on tap.

---

## 2. Characters: Tina & Toto

**What we have:** full-body reference art and body assets for both Tina and Toto.

**Decision for the prototype (override if you prefer):** use the **full-body characters** as the on-screen guides — placed at screen edges, lightly animated. The earlier "puppet on an ice-cream-stick" idea is **deferred** to a later visual pass, since no puppet art exists yet and the full-body art does. Don't block the build on art you don't have.

**Age variants:** 3 per character (same face, different age), selected by the login age slider → `avatar_variant` 0 (ages 4–5), 1 (6–7), 2 (8–10). *Confirm whether all three already exist; if only a base exists, produce variants 1 and 2 from it.*

**Role:** Tina and Toto **alternate** as the one who asks — sometimes Tina asks and the child answers "as Toto," sometimes the reverse. The active speaker is shown with a soft glow in their cue colour. They each have a distinct voice (§8).

**Animation needed (Lottie):** an idle loop each (blink / gentle sway / breathe), a "talking" state (subtle mouth/bob) to play under narration, and a happy reaction for encouragement.

---

## 3. The narrative & cutscene scripts (Hindi — final copy for narration)

All cutscenes are short, skippable, fully Hindi, built from illustrated shots + gentle motion (Ken-Burns pan/zoom or Lottie), with narration clips. Speaker is marked; generate that line in that character's voice.

### 3.1 World Intro Cutscene — route `/intro` (`cutscene_intro_*`)

- **Shot 1** — a glowing portal opens; **Toto** steps out.
  **Toto:** "नमस्ते! मैं टोटो हूँ। मैं अक्षरवन से आया हूँ।"
- **Shot 2** — we see Aksharvan with its colour and light draining away.
  **Toto:** "हमारी दुनिया अक्षरवन से रंग और रोशनी गायब हो रहे हैं।"
  **Tina:** "ओह नहीं! हमें कुछ करना होगा!"
- **Shot 3** — Toto extends a hand; fireflies gather.
  **Toto:** "हमें तुम्हारी मदद चाहिए। क्या तुम हमारे साथ चलोगे?"
  **Tina** *(to the child, breaking the fourth wall):* "क्या आप हमारी मदद करेंगे?"
- **End:** child taps **"हाँ!"** → transition to the map.

### 3.2 Jadooi Jungle Backstory — route `/level/level-1` (`cutscene_jungle_*`)

- **Shot 1** — the grey, decolorized forest.
  **Tina:** "यह है जादूई जंगल। पहले यहाँ बहुत सारे रंग थे।"
- **Shot 2** — emptiness: no trees, no animals.
  **Toto:** "लेकिन अब सब कुछ धूसर हो गया है — न रंग, न पेड़, न जानवर।"
- **Shot 3** — Toto gestures to the child.
  **Toto:** "हमें आपकी मदद चाहिए इस जंगल में वापस से रंग भरने के लिए।"
  **Tina:** "हर सही जवाब के साथ जंगल में जान लौट आएगी। चलो शुरू करें!"
- **End:** → exercise engine (sub-level 0).

### 3.3 Level Complete — route `/level/level-1/complete` (`cutscene_complete_*`)

- The fully restored, glowing forest; fireflies everywhere.
  **Tina + Toto:** "शाबाश! आपने जादूई जंगल को बचा लिया!"

---

## 4. Restoration storyboard (the reward loop)

Build the forest as **ONE layered scene** so every stage aligns perfectly — do **not** re-generate the forest per stage. Start from a fully grey/decolorized base; each completed sub-level reveals/colours the next layer, with a **firefly-stream** animation carrying light into the new layer, plus a short spoken line.

| Sub-level done | `restorationStage` | Layer revealed | Spoken line (`restore_*`) |
|---|---|---|---|
| 0 | `color` | base colour washes back into sky & ground | "वाह! रंग वापस आ गए!" |
| 1 | `grass` | grass & flowers bloom | "देखो, घास और फूल उग आए!" |
| 2 | `trees` | trees grow back | "पेड़ वापस आ गए!" |
| 3 | `rivers` | a river fills and flows | "नदी फिर से बहने लगी!" |
| 4 | `animals` | animals return | "जानवर लौट आए!" |
| 5 | `birds_sky` | birds + bright sky, full bloom | "पंछी और आसमान — जंगल फिर से जीवित हो गया!" |

**Designer deliverable:** the grey base + 6 perfectly-registered overlay layers (SVG layers or aligned WebP layers), exported so the frontend can fade/colour each in independently.

---

## 5. Exercise content (per the book — what the designer must illustrate)

Six letter pairs (Lesson 1). Each needs **two object illustrations**; letters and words are typographic (no images).

| SL | Object 1 (`image`/`audioName`) | Letter 1 | Object 2 | Letter 2 | Word |
|----|----|----|----|----|----|
| 0 | बतख `batakh` | ब | सपेरा `sapera` | स | बस |
| 1 | पतंग `patang` | प | रस्सी `rassi` | र | पर |
| 2 | अनार `anaar` | अ | बतख `batakh` (reuse) | ब | अब |
| 3 | घड़ी `ghadi` | घ | रस्सी `rassi` (reuse) | र | घर |
| 4 | तरबूज `tarbooj` | त | कछुआ `kachua` | क | तक |
| 5 | चम्मच `chammach` | च | लट्टू `lattu` | ल | चल |

**10 object illustrations to create:** batakh, sapera, patang, rassi, anaar, ghadi, tarbooj, kachua, chammach, lattu. (बतख and रस्सी are reused, so 10 unique, not 12.) Friendly, clearly recognizable to a 4-year-old, consistent line/colour style, on transparent background, scalable.

---

## 6. Asset inventory — HAVE vs CREATE

**HAVE**
- Tina & Toto full-body art + body assets. *(Confirm: all 3 age variants each, or just a base?)*

**CREATE — Graphic Design**
- Tina & Toto: missing age variants (if any), idle/talking/reaction **Lottie** animations.
- **Backgrounds:** main-menu bg; **Aksharvan map** (clickable regions, Jadooi Jungle active + glow, other regions greyed/locked); world-intro cutscene shots (×3); jungle-backstory shots (×3); level-complete shot.
- **Jadooi Jungle layered forest:** grey base + 6 restoration overlay layers (§4).
- **10 object illustrations** (§5).
- **Lottie effects:** firefly burst (success), firefly stream (restoration), confetti/fanfare (complete), memory-tile flip.

**CREATE — Audio (script here, generated by the backend TTS pipeline)**
- The full **narration manifest** in §7, in Tina and Toto voices as specified in §8.

**NOT created (typographic / in-app):** letter tiles (अक्षर) and the blended words — rendered from `Tiro Devanagari Hindi` in the app.

---

## 7. Master narration manifest (the audio script the TTS pipeline consumes)

Every line has a stable `audioName`. The frontend references these; the backend generates one file per id. **Pedagogy rule:** sound items say the object then the sound ("बतख — ब"), never "ब से बतख" / "बतख से ब".

**Recurring prompts** *(generate in BOTH Tina and Toto voices — engine picks by current speaker)*
- `prompt_yeh_kya_hai` — "यह क्या है?"
- `prompt_pehli_awaz` — "इसकी पहली आवाज़ क्या है?"
- `prompt_jodkar` — "इन्हें जोड़ें — कौन सा शब्द बना?"
- `prompt_match_build` — "इन अक्षरों से शब्द बनाओ।"
- `prompt_memory` — "एक जैसे अक्षर ढूँढो।"

**Encouragement** *(both voices)*
- `encourage_shabash` — "शाबाश!" · `encourage_bahut_badhiya` — "बहुत बढ़िया!" · `encourage_wah` — "वाह!"

**Gentle retry** *(both voices)*
- `nudge_try_again` — "कोई बात नहीं, फिर से कोशिश करो।" · `nudge_listen` — "ध्यान से सुनो।"

**Object names** *(single warm voice — these are "the content")*
- `obj_batakh` बतख · `obj_sapera` सपेरा · `obj_patang` पतंग · `obj_rassi` रस्सी · `obj_anaar` अनार · `obj_ghadi` घड़ी · `obj_tarbooj` तरबूज · `obj_kachua` कछुआ · `obj_chammach` चम्मच · `obj_lattu` लट्टू

**Letter sounds** *(single voice)*
- `sound_ba` ब · `sound_sa` स · `sound_pa` प · `sound_ra` र · `sound_a` अ · `sound_gha` घ · `sound_ta` त · `sound_ka` क · `sound_cha` च · `sound_la` ल

**Optional teaching clips (model the object→sound link):**
- `teach_batakh_ba` "बतख — ब", `teach_sapera_sa` "सपेरा — स", … (one per object/letter)

**Blended words** *(single voice)*
- `word_bas` बस · `word_par` पर · `word_ab` अब · `word_ghar` घर · `word_tak` तक · `word_chal` चल

**Restoration lines** *(see §4: `restore_color`, `restore_grass`, `restore_trees`, `restore_rivers`, `restore_animals`, `restore_birds_sky`)*

**Cutscene lines** *(see §3: `cutscene_intro_01..`, `cutscene_jungle_01..`, `cutscene_complete_01`)* — each in the marked speaker's voice.

---

## 8. Voice direction

- **Tina voice:** warm, bright, slightly higher; **Toto voice:** warm, playful, slightly lower. Both gentle, clear, child-directed, unhurried.
- Generated via the backend TTS pipeline (Sarvam AI / ElevenLabs multilingual), compressed mono ~24–32 kbps.
- Recurring prompts + encouragement + retry exist in **both** voices (speaker alternates by sub-level); object/sound/word/teach clips use a single consistent voice; cutscene lines use the marked speaker.
- Listen-test every sound clip for the ALfA phrasing rule before sign-off.

---

## 9. Naming & format conventions (the asset contract)

- **Ids match the content JSON exactly.** Images: `obj_<name>.svg` (or `.webp`). Audio: `<audioName>.opus` (Tina/Toto variants suffixed `__tina` / `__toto`). Lottie: `anim_<name>.json`. Forest layers: `forest_base.*`, `forest_layer_color.*`, `forest_layer_grass.*`, … matching `restorationStage`.
- **Formats:** illustrations **SVG** preferred (scalable, tiny), else **WebP/AVIF**; backgrounds **WebP/AVIF**; animations **Lottie JSON**; audio **Opus/AAC** mono. Everything optimized for low bandwidth.
- **Map regions:** provide as labelled vector regions with clear hit areas; mark Jadooi Jungle active, others locked.
- **Forest layers** exported in perfect registration so they overlay without shifting.
- Transparent backgrounds for characters and objects.

---

## 10. Production order (handoff-friendly)

1. **Style frame first:** one finished sample (the menu or the jungle backstory shot) to lock palette, line, and character treatment before mass production.
2. Confirm Tina/Toto age variants; produce missing ones + idle Lottie.
3. **Jadooi Jungle layered forest** (grey base + 6 layers) — unblocks the reward loop.
4. **10 object illustrations.**
5. **Aksharvan map** (active + locked regions).
6. **Cutscene shots** (intro ×3, backstory ×3, complete ×1) + motion notes.
7. **Lottie effects** (firefly burst/stream, fanfare, tile flip).
8. **Narration script sign-off** (§7) → backend generates audio → listen-test for ALfA phrasing.

---

## 11. Resolved decisions reflected here

- 7-step exercises (5 types, first two repeat per object) → object illustrations in §5; prompts in §7.
- Restoration order color → grass/flowers → trees → rivers → animals → birds/sky → §4 storyboard.
- Voice is core → full narration manifest §7, voice direction §8.
- Aksharvan = colourful clickable game map; Jadooi Jungle first, Rainbow Waterfall next, rest locked → §1.
- Guides = existing full-body Tina/Toto art; puppet styling deferred → §2.
