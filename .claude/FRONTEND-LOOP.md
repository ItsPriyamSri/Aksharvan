# Aksharvan Frontend Build Loop

> **Purpose:** Autonomous, self-terminating loop for Claude Code to build the **entire Level 1 frontend** from scratch with **full Appwrite integration wired from day one**, plus graceful fallbacks when the project is not yet provisioned.
>
> **Scope:** Next.js PWA, all screens, exercise engine, restoration flow, backend service layer. Do **not** modify `appwrite/functions/` or `appwrite.json` unless a frontend integration bug requires a documented contract fix.
>
> **Authority:** `docs/01-FRONTEND-PLAN.md` · `docs/INTEGRATION-PLAN.md` · `docs/BACKEND-INTEGRATION.md` · `docs/03-CONTENT-PLAN.md` · `CLAUDE.md` · `.claude/rules/frontend.md` · **Product decisions in §2 below** (override the frontend plan where they conflict)

---

## How to start (Claude Code)

### Recommended: `/goal`

```text
/goal Read .claude/FRONTEND-LOOP.md and execute exactly ONE iteration (§5). After each turn, re-read .claude/FRONTEND-STATUS.md and run the Completion Oracle (§9). Stop only when every epic E1–E11 is DONE and §9 passes with evidence. Never declare done without §9 evidence. Build real Appwrite integration in lib/appwrite/services/* as the primary code path; fallbacks only when env is unconfigured or calls fail.

Rules: @CLAUDE.md @.claude/rules/frontend.md @docs/01-FRONTEND-PLAN.md @docs/INTEGRATION-PLAN.md @docs/BACKEND-INTEGRATION.md
```

### Manual re-run

Use §10 iteration prompt.

---

## §1 — Integration architecture (CRITICAL — read before every iteration)

**Principle:** The frontend is **always built for production Appwrite**. Mocks are **fallback adapters**, not a parallel app. When the user sets `NEXT_PUBLIC_APPWRITE_ENDPOINT` + `NEXT_PUBLIC_APPWRITE_PROJECT_ID` and runs `appwrite push` + `appwrite deploy function --all`, the app must work **without code changes**.

### 1.1 Service layer pattern (mandatory)

All Appwrite access goes through `lib/appwrite/services/`. Components and hooks **never** call `account.createPhoneToken` or `functions.createExecution` directly.

```
lib/appwrite/
  client.ts              # singleton Web SDK (create in E1)
  config.ts              # isAppwriteConfigured(), isPlaceholderProjectId()
  services/
    auth.ts              # OTP + PIN + session
    profile.ts           # profiles CRUD
    progress.ts          # progress CRUD + dual-layer sync
    pin.ts               # set-pin Function
    asr.ts               # asr-recognize Function + Web Speech fallback
    audio.ts             # Howler + Appwrite audio URLs + speechSynthesis fallback
    assets.ts            # Appwrite Storage URLs + public/assets fallback
  types.ts               # (exists) — import, do not duplicate
  constants.ts           # (exists) — import, do not duplicate
```

**Every service function follows this shape:**

```ts
export async function doThing(args): Promise<Result> {
  if (isAppwriteConfigured()) {
    try {
      return await realAppwritePath(args);
    } catch (err) {
      // log structured error; fall through to fallback only for known dev cases
      if (shouldUseFallback(err)) return fallbackPath(args);
      throw err;
    }
  }
  return fallbackPath(args);
}
```

### 1.2 Configuration detection

```ts
// lib/appwrite/config.ts
export function isAppwriteConfigured(): boolean {
  const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT;
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
  return Boolean(
    endpoint &&
    projectId &&
    projectId !== 'YOUR_PROJECT_ID' &&
    !projectId.startsWith('YOUR_'),
  );
}
```

Show a small **dev banner** (only when `!isAppwriteConfigured()`) — "Offline dev mode — using local fallbacks". Hide when Appwrite is live.

### 1.3 Dual-path matrix

| Feature | Primary (production) | Fallback (dev / offline) | Sync on connect |
|---------|---------------------|--------------------------|-----------------|
| OTP login | `account.createPhoneToken` → `createSession` | Mock: any phone + OTP `000000` creates local session | N/A — user re-logs with real OTP |
| PIN login | `FUNCTION_LOGIN_WITH_PIN` → `createSession` | Mock: phone any + PIN `1234` | N/A |
| Profile | `databases.createDocument/get/update` on `profiles` | `localStorage` key `aksharvan:profile` | On first successful `account.get()`, push local profile to Appwrite if missing |
| Progress | `databases` upsert `${userId}_level-1` | `localStorage` key `aksharvan:progress` | **Merge:** on connect, if Appwrite doc exists use it; else upload local; if both exist prefer newer `updated_at` |
| Set PIN | `FUNCTION_SET_PIN` | Store `pin_set: true` in localStorage (mock only) | User sets real PIN when live |
| ASR (exercises 1–5) | `FUNCTION_ASR_RECOGNIZE` with `expected[]` | Web Speech API (`webkitSpeechRecognition`), Hindi `hi-IN` | Auto-use Function when configured |
| Narration audio | Howler + `storage.getFileView(BUCKET_AUDIO, audioName)` | `speechSynthesis` Hindi + on-screen Devanagari subtitle | Drop fallback when file URL returns 200 |
| Images / video | `storage.getFileView/Preview` OR `public/assets/` | `public/assets/` placeholders | Swap URL resolver only |
| Forest restoration | `public/assets/forest/forest_stage_*.webp` | same placeholders | Appwrite bucket when uploaded |

### 1.4 Progress state — extended for exact resume

Extend `ProgressState` usage (do not change backend schema) with client-side fields inside `state` JSON:

```ts
interface ProgressState {
  sublevels: SublevelProgress[];
  restorationStage: number;
  // client-owned resume fields (frontend-only, safe in same JSON blob):
  currentSublevelIndex?: number;   // 0..5
  currentExerciseIndex?: number;   // 0..6 within sublevel
  introSeen?: boolean;             // smart resume: skip /intro
  levelIntroSeen?: boolean;        // smart resume: skip level zoom intro
}
```

Always `JSON.stringify` on write to Appwrite. Backend accepts any JSON shape in `state`.

### 1.5 Hooks surface (create in E1/E2, use everywhere)

| Hook | Wraps |
|------|-------|
| `useAuth()` | `auth.service` — session, login, logout |
| `useProfile()` | `profile.service` |
| `useProgress(levelId)` | `progress.service` — parsed state + save |
| `useNarration(audioName, speaker)` | `audio.service` — play + subtitle |
| `useASR(expected, exerciseId)` | `asr.service` — record + recognize |
| `useAppwriteStatus()` | `isAppwriteConfigured()` + connection health |

Check `lib/hooks/` before creating new hooks.

---

## §2 — Product decisions (override frontend plan where noted)

These were confirmed by the product owner. **Follow these over conflicting text in `01-FRONTEND-PLAN.md`.**

### Flow

```
/login → /menu → [smart resume]
  ├─ first visit: /intro (portrait video, skippable) → /map
  ├─ returning, mid-level: /level/level-1/play (exact exercise)
  └─ otherwise: /map

/map → tap Jadooi Jungle → /level/level-1
  └─ grey forest zoom-in + stick puppets (Tina/Toto) + Hindi narration
     ("जंगल को बचाने के लिए कुछ सवालों के जवाब देने होंगे" or similar)
     → /level/level-1/play

/play → 7 exercises × 6 sub-levels
  └─ after each sub-level: restoration crossfade + Hindi line → next sub-level

After sub-level 6 (birds/sky): celebration Hindi line
  ("याय! हमने कर दिखाया, अक्षरवन वापस हरा-भरा हो गया!")
  → button back to /map (Jadooi Jungle shows completed/green state)

/settings from menu: change age, logout, set/change PIN
```

### Smart resume rules

1. No session → `/login`
2. Session + `introSeen !== true` → `/intro` on Play
3. Session + `currentSublevelIndex`/`currentExerciseIndex` in progress → `/level/level-1/play` at exact step
4. Else → `/map`

### Exercise input modes

| Step | Type | Input | Voice output |
|------|------|-------|--------------|
| 1–5 | name_object, first_sound, blend | **Voice only — NO tap options** | Yes (Tina/Toto alternate) |
| 6 | match_build | **Tap letters in order** | Yes (prompt narration) |
| 7 | memory | **Tap to flip/match pairs** | Yes (prompt narration) |

**Voice-only failure path (exercises 1–5):** after **2 failed** ASR attempts → play hint audio (`nudge_try_again` / "फिर से कोशिश करो") → **show correct answer visually** → **auto-advance** (no tap to continue).

**Mic:** auto-arm when prompt narration ends (exercises 1–5). Show states: idle → listening → thinking → result.

### Cutscenes & assets

| Asset | Format | Notes |
|-------|--------|-------|
| Menu background | `public/assets/bg/menu.webp` placeholder | User replaces later |
| World intro | `public/assets/video/intro_portrait.mp4` placeholder | Portrait video player, **always skippable** |
| Map | `public/assets/bg/map_aksharvan.webp` + hotspot overlay for Jadooi Jungle | Other regions locked/greyed |
| Level entry forest | `public/assets/forest/forest_stage_0_grey.webp` | Ken Burns / slow zoom |
| Restoration stages 0–6 | `forest_stage_0_grey` → `forest_stage_1_color` → … → `forest_stage_6_birds_sky` | Crossfade + Hindi line per stage |
| Object images (12) | `public/assets/objects/obj_<name>.webp` | बतख, सपेरा, पतंग, रस्सी, अनार, घड़ी, तरबूज, कछुआ, चम्मच, लट्टू |
| Tina/Toto puppets | `public/assets/characters/tina_stick.webp`, `toto_stick.webp` | CSS/Framer bob + glow ring in cue colour when speaking |

### Visual / UX

- **Exercise background:** minimal dark twilight (`--bg-twilight`), not forest during questions
- **Design system:** follow `01-FRONTEND-PLAN.md` §3 (fireflies, fonts, palette)
- **Orientation:** responsive — portrait preferred, landscape allowed (no hard lock)
- **PWA:** `@serwist/next` required in E1
- **Letter tiles:** typographic (`Tiro Devanagari Hindi`), never images

### Auth

- Full login UI: **OTP tab** + **PIN tab** + age slider (4–10) + Hindi locked
- Mock backend when Appwrite not configured: any phone, OTP `000000`, PIN `1234`
- Real paths must still be implemented and used when `isAppwriteConfigured()`

### Narration (dev → prod)

1. **Now:** `speechSynthesis` Hindi (`hi-IN`) + Devanagari subtitle on screen
2. **Later:** Howler plays `storage.getFileView(BUCKET_AUDIO, audioName)` or `public/assets/audio/<audioName>.opus`
3. Audio service tries real file first; falls back to synthesis + subtitle

---

## §3 — Target repository layout

```
app/
  layout.tsx                    # fonts, AppProviders, PWA
  page.tsx                      # redirect: session → smart resume target, else /login
  login/page.tsx
  menu/page.tsx
  settings/page.tsx
  intro/page.tsx                # portrait video player
  map/page.tsx
  level/[levelId]/page.tsx      # level entry zoom + puppets
  level/[levelId]/play/page.tsx # exercise engine + restoration
  level/[levelId]/complete/page.tsx
  generateStaticParams           # [{ levelId: 'level-1' }]

components/
  ui/                           # Button, Slider, etc.
  auth/                         # OTP form, PIN form, age slider
  characters/                   # PuppetGuide (Tina/Toto stick + glow)
  cutscene/                     # VideoPlayer, LevelIntro
  map/                          # MapView + hotspot
  exercise/                     # ExercisePlayer, NameObject, FirstSound, Blend, MatchBuild, Memory
  restoration/                  # ForestRestoration crossfade
  audio/                        # MicIndicator, SubtitleOverlay
  effects/                      # FireflyBurst

lib/
  appwrite/                     # client, config, services/*
  content/
    level1.ts                   # bundled Level 1 seed (from plan §5)
  hooks/                        # useAuth, useProfile, useProgress, useNarration, useASR

public/
  assets/                       # placeholders — see §2 asset table
  manifest.json

next.config.ts                  # output: 'export', images.unoptimized
```

---

## §4 — Epic definitions (work queue)

Work **in order**. One epic (or one story within an epic) per iteration.

### E1 — Project shell + service layer (~7h)

- `npx create-next-app` pattern: Next 14 App Router, TS, Tailwind, `output: 'export'`
- Design tokens CSS vars + `next/font` (Baloo 2, Mukta, Tiro Devanagari Hindi)
- `@serwist/next` PWA scaffold
- `lib/appwrite/client.ts`, `config.ts`, empty `services/*` stubs with dual-path signatures
- `AppProviders`: auth context, audio unlock gate, route guard skeleton
- `lib/content/level1.ts` — seed all 6 sub-levels from `01-FRONTEND-PLAN.md` §5
- `public/assets/` placeholder structure + README in folder listing expected files
- `npm run dev`, `typecheck`, `lint`, `build` all pass

### E2 — Auth & profile (~8h)

- `/login`: OTP tab + PIN tab + age slider + spoken labels (subtitle + synthesis)
- `auth.service`: real `createPhoneToken`/`createSession` + mock fallback
- `profile.service`: real `createDocument` + localStorage mirror + sync on connect
- `pin.service`: real `FUNCTION_SET_PIN` + mock
- Route guards via `useAuth`
- `/settings`: age update, logout, set PIN (calls `pin.service`)
- Create `progress` doc on first login (via `progress.service`)

### E3 — Menu + map (~8h)

- `/menu`: placeholder bg, Play (खेलें), Settings (सेटिंग्स), puppet guides idle, firefly motes
- Play triggers smart resume logic
- `/map`: map image + Jadooi Jungle hotspot → `/level/level-1`
- Locked regions: grey overlay + "जल्द आ रहा है" toast
- Completed state: green glow on Jadooi Jungle when all 6 sub-levels done

### E4 — Cutscenes (~6h)

- `/intro`: `<video>` portrait, skip always visible, mark `introSeen` in progress on complete/skip
- `/level/[levelId]`: grey forest zoom (Framer Motion), puppets + narration, then route to play
- `assets.service` resolves video/image paths (public → Appwrite when live)

### E5 — Exercise engine core (~14h)

- Generic `ExercisePlayer` reading `lib/content/level1.ts`
- Implement `name_object`, `first_sound`, `blend` — **voice only, no tap options**
- Speaker alternation Tina/Toto with puppet glow
- Auto-advance on success; 2-fail hint path
- Dark twilight exercise layout
- Persist `currentSublevelIndex` + `currentExerciseIndex` after each step

### E6 — Match-build (~8h)

- Tap letters in order, `minToPass: 3`, non-words allowed
- Voice narration on enter; tap-only input
- Real-word bonus sparkle (optional polish)

### E7 — Memory game (~8h)

- Dynamic pool from cumulative letters; cap 6 pairs; 3s reveal; pairs stay matched
- Tap only; voice narration on enter

### E8 — Voice pipeline (~10h)

- `asr.service`: MediaRecorder → base64 → `FUNCTION_ASR_RECOGNIZE`; fallback Web Speech API
- `useASR` hook: mic states, auto-arm after narration
- `audio.service`: Howler when file exists; else synthesis + `SubtitleOverlay`
- Wire exercises 1–5 end-to-end

### E9 — Restoration + celebration (~8h)

- After sub-level complete: full-screen crossfade `forest_stage_N` → `forest_stage_N+1`
- Hindi line per stage (from content plan `restore_*` or synthesis)
- Firefly stream animation (lightweight)
- `/level/level-1/complete`: celebration copy → map button
- Update `restorationStage` + sublevel `completed` in progress

### E10 — Progress sync (~4h)

- `progress.service` dual-layer: Appwrite primary, localStorage mirror
- Sync/merge on `account.get()` success
- Smart resume wired in menu Play + app entry
- Cross-device: when Appwrite live, same account reads same doc

### E11 — Polish & handoff (~10h)

- `prefers-reduced-motion` respected
- PWA precache shell + runtime cache for assets/audio
- Dev banner when fallback mode
- Throttled-network smoke test documented
- Update `docs/INTEGRATION-PLAN.md` only if wiring changed
- All §9 oracle checks pass

---

## §5 — Single-iteration protocol

### Step 0 — Orient

1. Read `.claude/FRONTEND-STATUS.md`
2. Read epic section in this file + matching section in `INTEGRATION-PLAN.md`
3. Read `.claude/rules/frontend.md`
4. Search `lib/appwrite/services/`, `components/`, `lib/hooks/` — extend, don't duplicate

### Step 1 — Plan

Write 3–6 bullets in FRONTEND-STATUS.md: files to touch, real Appwrite paths to wire, fallbacks needed.

### Step 2 — Implement

- Real service path **first**, fallback **second** in same function
- `'use client'` on all interactive files
- No secrets in client bundle
- No direct SDK calls outside `lib/appwrite/services/`

### Step 3 — Verify

```bash
npm run typecheck
npm run lint
npm run build
# grep: no direct createPhoneToken outside services
rg "createPhoneToken|createExecution" --glob "!lib/appwrite/**" --glob "!docs/**" .
# grep: no API keys in client
rg -i "SARVAM|APPWRITE_API_KEY|sk-" app/ components/ lib/ --glob "!**/*.md"
```

### Step 4 — Update FRONTEND-STATUS.md

Epic table, backend integration checklist, verification log, iteration++.

### Step 5 — Reflect (every 3 iterations)

- Are services real-path-first?
- Did I scope-creep into backend functions?
- Does smart resume still work with mock progress?

### Step 6 — Run Completion Oracle (§9)

---

## §6 — Content seed (Level 1)

Use exact data from `01-FRONTEND-PLAN.md` §5 / §8:

- 6 sub-levels, 7 exercises each
- Objects: बतख→ब, सपेरा→स, पतंग→प, रस्सी→र, अनार→अ, घड़ी→घ, तरबूज→त, कछुआ→क, चम्मच→च, लट्टू→ल
- Words: बस, पर, अब, घर, तक, चल
- Restoration order: color → grass → trees → rivers → animals → birds_sky
- `expected[]` for ASR must include Hindi + roman variants (e.g. `["बतख","batakh","बतख है"]`)

Generate `exercises[]` in `level1.ts` from the 5 types — do not hardcode in components.

---

## §7 — Escalation & safety

| Condition | Action |
|-----------|--------|
| Appwrite not configured | Continue with fallbacks; mark integration row "fallback only" |
| Web Speech API unavailable | Show subtitle + manual "मैंने बोला" dev button hidden behind `NODE_ENV=development` |
| Missing asset file | Coloured placeholder `<div>` + filename label |
| 25 iterations without §9 pass | Stop; document remaining work |
| Tempted to edit `appwrite/functions/` | Stop; file backend bug separately |

**Never** remove real Appwrite code paths to make mocks simpler.

---

## §8 — Appwrite go-live checklist (document in README; user runs manually)

When the user connects Appwrite, these steps should make the app work with **zero frontend code changes**:

1. Set `.env.local`: `NEXT_PUBLIC_APPWRITE_ENDPOINT`, `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
2. `appwrite push`
3. `appwrite deploy function --all`
4. Configure MSG91 in Appwrite console
5. Register web platform origin in Appwrite console
6. `npm run generate-audio` (populates `audio` bucket)
7. Upload assets to Storage buckets OR keep using `public/assets/` (assets service handles both)
8. `npm run dev` — dev banner should disappear; OTP should send real SMS

---

## §9 — Completion Oracle (stop condition)

### A. Routes exist and render

- [ ] `/login`, `/menu`, `/settings`, `/intro`, `/map`
- [ ] `/level/level-1`, `/level/level-1/play`, `/level/level-1/complete`
- [ ] `generateStaticParams` for `level-1`
- [ ] `npm run build` exits 0

### B. Service layer (real paths exist — read source)

- [ ] `lib/appwrite/client.ts` singleton
- [ ] `lib/appwrite/config.ts` with `isAppwriteConfigured()`
- [ ] `auth.service`: real OTP + PIN + mock fallback
- [ ] `profile.service`: real CRUD + localStorage sync
- [ ] `progress.service`: real upsert + dual-layer + extended resume fields
- [ ] `asr.service`: real Function + Web Speech fallback
- [ ] `audio.service`: Howler + synthesis fallback
- [ ] No SDK calls outside `lib/appwrite/`

### C. User flow

- [ ] Login (mock OTP `000000` works without Appwrite)
- [ ] Play → intro (first time) → map → Jadooi Jungle → level intro → 7 exercises
- [ ] Exercises 1–5 voice-only; 6–7 tap-only
- [ ] 2-fail hint + visual reveal + auto-advance on voice exercises
- [ ] Restoration crossfade after each sub-level (6 times)
- [ ] Celebration → map with completed Jadooi Jungle
- [ ] Smart resume to exact exercise
- [ ] Settings: age, logout, PIN

### D. Backend contract alignment

- [ ] Function payloads match `lib/appwrite/types.ts`
- [ ] Progress doc id `${userId}_level-1`
- [ ] Profile doc id = account `$id`
- [ ] `JSON.stringify`/`parse` on progress.state

### E. PWA & quality

- [ ] Serwist service worker registered
- [ ] `prefers-reduced-motion` handled
- [ ] `npm run lint` + `typecheck` pass
- [ ] No `console.log` added in changed files

---

## §10 — Iteration prompt (copy for manual re-run)

```text
You are building the Aksharvan frontend. Read .claude/FRONTEND-LOOP.md §5 and execute ONE iteration.

Rules: @CLAUDE.md @.claude/rules/frontend.md @docs/01-FRONTEND-PLAN.md @docs/INTEGRATION-PLAN.md @docs/BACKEND-INTEGRATION.md

CRITICAL: Implement real Appwrite integration in lib/appwrite/services/* as the primary code path. Use fallbacks only when isAppwriteConfigured() is false or calls fail gracefully. When the user connects Appwrite later, the app must work without code changes.

1. Read .claude/FRONTEND-STATUS.md — work on Current epic only
2. Implement smallest complete slice toward epic DONE
3. Run §5 Step 3 verification; paste output
4. Update .claude/FRONTEND-STATUS.md
5. Run §9 Completion Oracle — if all pass, respond "FRONTEND COMPLETE" and stop

Product decisions in FRONTEND-LOOP.md §2 override conflicting frontend plan text.
```
