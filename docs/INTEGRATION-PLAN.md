# Aksharvan — Frontend ↔ Backend Integration Plan

> **Purpose:** Step-by-step wiring guide for building the Next.js frontend against
> the existing Appwrite backend. Follow this in order — each section maps to a
> frontend epic (E1–E10 from `01-FRONTEND-PLAN.md`).
>
> **Backend is already deployed (or ready to deploy).** Every file, collection,
> bucket, and Function described here exists in the codebase. The frontend team
> needs zero backend knowledge beyond this document.
>
> **Single source of truth for types and IDs:**
> - `lib/appwrite/types.ts` — all TypeScript interfaces
> - `lib/appwrite/constants.ts` — all database, bucket, and function IDs

---

## 0. Prerequisites checklist

Before writing a single line of frontend code:

- [ ] `NEXT_PUBLIC_APPWRITE_ENDPOINT` set in `.env.local` (copy from `.env.example`)
- [ ] `NEXT_PUBLIC_APPWRITE_PROJECT_ID` set in `.env.local`
- [ ] Appwrite project created and `appwrite push` run (provisions schema)
- [ ] `appwrite deploy function --all` run (deploys the three Functions)
- [ ] SMS provider (MSG91) configured in the Appwrite console — required for OTP
- [ ] `npm run generate-audio` run with `SARVAM_API_KEY` set — populates the `audio` bucket

If Appwrite isn't provisioned yet: the frontend can still be built with mock data.
All wiring below works against any live Appwrite project once env vars are set.

---

## 1. SDK client setup (E1 — project shell)

Create exactly one file that initialises the Appwrite Web SDK. Every page and hook
imports from here — never construct `new Client()` elsewhere.

**File to create: `lib/appwrite/client.ts`**

```ts
import { Client, Account, Databases, Functions, Storage } from 'appwrite';

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const account   = new Account(client);
export const databases = new Databases(client);
export const functions = new Functions(client);
export const storage   = new Storage(client);
```

> `lib/appwrite/constants.ts` and `lib/appwrite/types.ts` already exist —
> import from them. Do not re-declare IDs or interfaces.

---

## 2. Auth — phone OTP signup & login (E2)

### 2a. New user signup

```
[/login page]
  │
  ├─ user enters phone → account.createPhoneToken(ID.unique(), phone)
  │    response: { userId, ... }  ← capture userId
  │
  ├─ user enters OTP  → account.createSession(userId, otpCode)
  │    session is now active and persisted by the SDK
  │
  └─ create profiles doc (see §3a below)
```

### 2b. Returning user — session still active

```ts
// In AppProviders / route guard
try {
  const user = await account.get();   // throws if no session
  // session valid → load profile, route to /menu
} catch {
  // no session → route to /login
}
```

### 2c. Returning user — PIN login (no fresh OTP)

```
[/login page — PIN tab]
  │
  ├─ user enters phone + 4-digit PIN
  │
  ├─ functions.createExecution(FUNCTION_LOGIN_WITH_PIN, JSON.stringify({ phone, pin }))
  │    response body: LoginWithPinResponse { userId, secret }
  │
  └─ account.createSession(userId, secret)
       session is now active
```

**Error handling:** the Function returns `{ error, code }` on failure.
`code: 'AUTH_FAILED'` = wrong phone or PIN (same shape — no enumeration).
`code: 'RATE_LIMITED'` = too many attempts, show a cooldown message.

### 2d. Logout

```ts
await account.deleteSession('current');
router.replace('/login');
```

---

## 3. Profiles collection (E2)

### 3a. Create on signup — immediately after createSession

```ts
import { Permission, Role } from 'appwrite';
import { databases } from '@/lib/appwrite/client';
import { DATABASE_ID, COLLECTION_PROFILES } from '@/lib/appwrite/constants';
import type { Profile } from '@/lib/appwrite/types';

const userId = (await account.get()).$id;

await databases.createDocument<Profile>(
  DATABASE_ID,
  COLLECTION_PROFILES,
  userId,                        // doc id = account $id — always
  {
    parent_phone:   phone,
    language:       'hi',
    child_age:      age,         // 4–10 from the age slider
    avatar_variant: age <= 5 ? 0 : age <= 7 ? 1 : 2,
    pin_hash:       null,        // set later via set-pin Function
    created_at:     new Date().toISOString(),
  },
  [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ],
);
```

### 3b. Read profile

```ts
const profile = await databases.getDocument<Profile>(
  DATABASE_ID, COLLECTION_PROFILES, userId
);
```

### 3c. Set PIN (after signup — optional)

```ts
import { ExecutionMethod } from 'appwrite';
import { functions } from '@/lib/appwrite/client';
import { FUNCTION_SET_PIN } from '@/lib/appwrite/constants';
import type { SetPinRequest, SetPinResponse } from '@/lib/appwrite/types';

const exec = await functions.createExecution(
  FUNCTION_SET_PIN,
  JSON.stringify({ pin } satisfies SetPinRequest),
  false, '/', ExecutionMethod.POST,
);
const result: SetPinResponse = JSON.parse(exec.responseBody);
// result.ok === true
```

---

## 4. Progress collection (E10)

Document id is always `${userId}_${levelId}` — this is the upsert key.

### 4a. First time a user reaches a level — create

```ts
import { ProgressState, Progress } from '@/lib/appwrite/types';
import { DATABASE_ID, COLLECTION_PROGRESS } from '@/lib/appwrite/constants';

const docId   = `${userId}_level-1`;
const initial: ProgressState = { sublevels: [], restorationStage: 0 };

await databases.createDocument<Progress>(
  DATABASE_ID, COLLECTION_PROGRESS, docId,
  {
    profile_id: userId,
    level_id:   'level-1',
    state:      JSON.stringify(initial),   // ← always stringify
    updated_at: new Date().toISOString(),
  },
  [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ],
);
```

### 4b. Read + parse state

```ts
const doc   = await databases.getDocument<Progress>(DATABASE_ID, COLLECTION_PROGRESS, docId);
const state: ProgressState = JSON.parse(doc.state);   // ← always parse
```

### 4c. Save after each sub-level

```ts
await databases.updateDocument(DATABASE_ID, COLLECTION_PROGRESS, docId, {
  state:      JSON.stringify(updatedState),  // ← always stringify
  updated_at: new Date().toISOString(),
});
```

> **Cross-device sync is automatic.** Any device signed into the same account
> reads the same document. No extra code required.

### 4d. Resume logic

On `/level/[levelId]/play` load:
1. Attempt `getDocument` with `${userId}_level-1`
2. If 404 → create (§4a above) with empty initial state
3. `JSON.parse(doc.state)` → find the first sublevel with `status !== 'completed'` → start there

---

## 5. Voice answering — ASR (E8)

```
[exercise screen — mic armed]
  │
  ├─ MediaRecorder records ~2–4s clip (mono, audio/webm or audio/ogg)
  │
  ├─ reader.readAsDataURL(blob) → strip "data:...;base64," prefix → audioBase64
  │
  ├─ functions.createExecution(
  │    FUNCTION_ASR_RECOGNIZE,
  │    JSON.stringify({ audioBase64, mimeType, expected, exerciseId }),
  │    false, '/', ExecutionMethod.POST,
  │    { 'x-consent': String(consentGranted) }   // 'true' only if parent consented
  │  )
  │
  └─ response: AsrRecognizeResponse { matched, confidence, transcript }
       matched  → run success path (firefly burst, advance)
       !matched → gentle nudge (re-narrate, retry or tap fallback)
```

**Types:**
```ts
import type { AsrRecognizeRequest, AsrRecognizeResponse } from '@/lib/appwrite/types';
import { FUNCTION_ASR_RECOGNIZE } from '@/lib/appwrite/constants';
```

**Keep clips short (≤4s, mono).** The Function decodes and forwards to Sarvam AI.
Matching is already child-lenient (substring containment + fuzzy edit distance ≤ 2).

---

## 6. Audio playback — narration clips (E1, E5–E9)

All narration clips are pre-generated and live in the `audio` Appwrite bucket.
The file id equals the `audioName` from the content JSON.

```ts
import { storage } from '@/lib/appwrite/client';
import { BUCKET_AUDIO } from '@/lib/appwrite/constants';

// Resolve to a URL (pass to Howler or <audio>)
const url = storage.getFileView(BUCKET_AUDIO, audioName).toString();
// e.g. audioName = 'prompt_yeh_kya_hai__tina' → plays Tina's voice asking the question

// Preload Howler for the current sub-level before the first exercise
```

Voice selection: prompts and encouragement exist in both `__tina` and `__toto`
suffixed variants. Pick based on whose turn it is (alternate per sub-level).

---

## 7. Static assets — images, Lottie, backgrounds (E3–E9)

```ts
import { BUCKET_IMAGES, BUCKET_ANIMATIONS } from '@/lib/appwrite/constants';

// Full-res (SVG / Lottie)
const svgUrl    = storage.getFileView(BUCKET_IMAGES, 'obj_batakh').toString();
const lottieUrl = storage.getFileView(BUCKET_ANIMATIONS, 'anim_tina_idle').toString();

// Low-bandwidth image (resize + WebP conversion via Appwrite CDN)
const thumbUrl  = storage.getFilePreview(
  BUCKET_IMAGES, 'bg_jungle_grey',
  400,           // width
  undefined,     // height (keep ratio)
  undefined,     // gravity
  70,            // quality
  undefined, undefined, undefined, undefined, undefined, undefined,
  'webp',        // output format
).toString();
```

With `output: 'export'`, set `images: { unoptimized: true }` in `next.config.ts`
and use an `<img>` tag (or a thin wrapper component) for Appwrite-hosted images.

---

## 8. Per-screen wiring summary

| Screen / Route | Backend calls |
|---|---|
| `/login` | `createPhoneToken` → `createSession` → `createDocument` on `profiles` |
| `/login` (PIN tab) | `FUNCTION_LOGIN_WITH_PIN` → `createSession` |
| `/menu` | `account.get()` (guard), `getDocument` on `profiles` |
| `/settings` | `updateDocument` on `profiles` (age / language) |
| `/intro` | `getFileView(BUCKET_AUDIO, 'cutscene_intro_*')` |
| `/map` | `getDocument` on `progress` (to show restoration state on map icon) |
| `/level/[levelId]` | `getFileView(BUCKET_AUDIO, 'cutscene_jungle_*')` |
| `/level/[levelId]/play` | `getDocument`/`createDocument` on `progress`; `FUNCTION_ASR_RECOGNIZE`; `getFileView(BUCKET_AUDIO, *)` for narration; `getFileView(BUCKET_IMAGES, *)` for object illustrations |
| `/level/[levelId]/complete` | `updateDocument` on `progress` (mark all done); `getFileView(BUCKET_AUDIO, 'cutscene_complete_*')` |

---

## 9. State management wiring

Keep Appwrite calls out of components. Suggested hook surface:

| Hook | Wraps |
|---|---|
| `useAuth()` | `account.get()`, `createPhoneToken`, `createSession`, `deleteSession` |
| `useProfile()` | `getDocument`/`createDocument`/`updateDocument` on `profiles` |
| `useProgress(levelId)` | `getDocument`/`createDocument`/`updateDocument` on `progress`; exposes parsed `ProgressState` |
| `useNarration(audioName)` | `storage.getFileView(BUCKET_AUDIO, audioName)` → Howler instance |
| `useASR(expected, exerciseId)` | MediaRecorder + `FUNCTION_ASR_RECOGNIZE` execution |

All hooks live in `lib/hooks/`. Check there before writing a new one.

---

## 10. Error handling contract

Every Appwrite SDK call can throw an `AppwriteException`. Every Function execution
returns a response body even on failure — always check `exec.responseStatusCode`.

```ts
// SDK calls
try {
  const doc = await databases.getDocument(...);
} catch (e) {
  if (e instanceof AppwriteException && e.code === 404) {
    // doc doesn't exist yet — create it
  }
}

// Function calls
const exec = await functions.createExecution(...);
if (exec.responseStatusCode !== 200) {
  const { error, code }: FunctionError = JSON.parse(exec.responseBody);
  // handle by code: 'AUTH_FAILED' | 'RATE_LIMITED' | 'ASR_ERROR' | 'INTERNAL_ERROR'
}
```

Import `FunctionError` from `@/lib/appwrite/types`.

---

## 11. Build-time checklist (before shipping)

- [ ] `npm run typecheck` exits 0
- [ ] `npm run lint` exits 0
- [ ] `npm run build` exits 0 — static export must complete without errors
- [ ] No `console.log` left in any file
- [ ] No hardcoded Appwrite IDs — all from `@/lib/appwrite/constants`
- [ ] No Appwrite API key in client bundle — run `grep -r APPWRITE_API_KEY .next/` to verify
- [ ] Service worker precaches audio + image URLs for offline use
- [ ] Tested on a throttled connection (Chrome DevTools → Slow 3G)
- [ ] `account.createSession` errors surface a user-facing retry, not a console error
