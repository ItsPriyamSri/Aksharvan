# Aksharvan — Backend Integration Guide

> **Audience:** Frontend developers integrating against the Appwrite backend.
> You need zero knowledge of backend implementation to use this guide — just the
> Appwrite Web SDK, two env vars, and the types from `lib/appwrite/types.ts`.
>
> **Updated by:** backend builder each epic. Sections marked _TODO_ are pending
> future epics.

---

## Quick reference

| What you need | Where to get it |
|---|---|
| Appwrite endpoint | `process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT` |
| Appwrite project ID | `process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID` |
| TypeScript types | `import type { … } from '@/lib/appwrite/types'` |
| Resource IDs (constants) | `import { … } from '@/lib/appwrite/constants'` |
| Function IDs | `FUNCTION_SET_PIN`, `FUNCTION_LOGIN_WITH_PIN`, `FUNCTION_ASR_RECOGNIZE` in `constants.ts` |

---

## 1. SDK setup

```ts
// lib/appwrite/client.ts  (create this file in the frontend)
import { Client, Account, Databases, Functions, Storage } from 'appwrite';

const client = new Client()
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT!)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID!);

export const account   = new Account(client);
export const databases = new Databases(client);
export const functions = new Functions(client);
export const storage   = new Storage(client);
```

Copy `.env.example` to `.env.local` and fill in the real project values for local dev.

---

## 2. Authentication — Phone OTP flow

Appwrite handles phone + OTP natively. No custom endpoint.

### 2.1 Signup / first login

```ts
import { ID } from 'appwrite';
import { account } from '@/lib/appwrite/client';

// Step 1 — send SMS code; capture userId from the response
const token = await account.createPhoneToken(ID.unique(), '+91XXXXXXXXXX');
const { userId } = token;

// Step 2 — verify OTP; creates and persists the session
await account.createSession(userId, otpCode);
```

**Returning user (session expired or new device):** pass the known `userId` instead of
`ID.unique()` so the same Appwrite account gets a new token:

```ts
const token = await account.createPhoneToken(existingUserId, phone);
```

### 2.2 SMS provider setup (console steps — no secrets in code)

Configure a phone SMS provider in the **Appwrite Cloud console** under
**Auth → SMS provider**. Recommended for India: **MSG91**.

Steps:
1. Sign up at [msg91.com](https://msg91.com) and get an API key + sender ID.
2. In the Appwrite console → **Settings → Auth → Phone (SMS)** → select **MSG91**.
3. Enter your MSG91 API key, sender ID, and DLT template ID (required by TRAI for India).
4. Enable phone authentication under **Auth → Settings → Phone**.
5. Set OTP expiry to 15 minutes (Appwrite default).

**What to store in Appwrite Function env vars (NOT in source code):**
- MSG91 API key is only needed by Appwrite's internal SMS provider logic — you configure
  it in the console. Your Functions do not need it.

### 2.3 `profiles` document — create on signup

After `createSession` succeeds, create the `profiles` document in the same call:

```ts
import { Permission, Role } from 'appwrite';
import { databases } from '@/lib/appwrite/client';
import { DATABASE_ID, COLLECTION_PROFILES } from '@/lib/appwrite/constants';
import type { Profile } from '@/lib/appwrite/types';

const userId = (await account.get()).$id;

await databases.createDocument<Profile>(
  DATABASE_ID,
  COLLECTION_PROFILES,
  userId,           // document id = account $id (1:1)
  {
    parent_phone:   phone,         // the phone used at signup
    language:       'hi',          // locked to Hindi for Level 1
    child_age:      age,           // from the age slider (4–10)
    avatar_variant: avatarVariant, // 0 (4–5), 1 (6–7), 2 (8–10)
    pin_hash:       null,          // set later via set-pin Function
    created_at:     new Date().toISOString(),
  },
  [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ]
);
```

**Important:** set per-document permissions at create time. The collection has
`documentSecurity: true`, meaning no collection-wide access is granted — each
document is private to the user who created it.

### 2.4 Session persistence

The Appwrite Web SDK automatically stores and refreshes the session in
`localStorage`. On subsequent app loads, call:

```ts
try {
  const user = await account.get();
  // user is logged in — read their profile, resume progress
} catch {
  // session expired or does not exist — send to /login
}
```

Use this as the route guard in `AppProviders`. No manual token storage needed.

### 2.5 Logout

```ts
await account.deleteSession('current');
// then redirect to /login
```

### 2.6 PIN-based quick login

For returning users who prefer not to receive a new SMS, the `login-with-pin`
Function lets them log in with their phone + a 4-digit PIN set at signup.
See **§4 (Functions)** for the full flow.

---

## 3. Database — profiles & progress

All database operations use the **Appwrite Web SDK** directly. Every document is
protected by per-document permissions (§2.3 above), so users can only read/write
their own data.

### 3.1 Reading a profile

```ts
import type { Profile } from '@/lib/appwrite/types';

const profile = await databases.getDocument<Profile>(
  DATABASE_ID, COLLECTION_PROFILES, userId
);
```

### 3.2 Progress — deterministic document ID

Progress documents use the id `${userId}_${levelId}` — a natural upsert key.

**Create (first time a user starts a level):**

```ts
import type { Progress, ProgressState } from '@/lib/appwrite/types';

const docId   = `${userId}_level-1`;
const initial: ProgressState = {
  sublevels:        [],
  restorationStage: 0,
};

await databases.createDocument<Progress>(
  DATABASE_ID, COLLECTION_PROGRESS,
  docId,
  {
    profile_id: userId,
    level_id:   'level-1',
    state:      JSON.stringify(initial),   // always stringify
    updated_at: new Date().toISOString(),
  },
  [
    Permission.read(Role.user(userId)),
    Permission.update(Role.user(userId)),
    Permission.delete(Role.user(userId)),
  ]
);
```

**Read and parse:**

```ts
const doc  = await databases.getDocument<Progress>(DATABASE_ID, COLLECTION_PROGRESS, docId);
const state: ProgressState = JSON.parse(doc.state);
```

**Update (after each sub-level):**

```ts
await databases.updateDocument(DATABASE_ID, COLLECTION_PROGRESS, docId, {
  state:      JSON.stringify(updatedState),
  updated_at: new Date().toISOString(),
});
```

Cross-device sync is automatic: any device signed into the same account reads
the same `progress` document.

---

## 4. Functions

All Functions are invoked via the Appwrite Web SDK. The caller's session is
forwarded automatically by the SDK except for `login-with-pin`, which must be
called **before** a session exists.

```ts
import { ExecutionMethod } from 'appwrite';
import { functions } from '@/lib/appwrite/client';
import {
  FUNCTION_SET_PIN,
  FUNCTION_LOGIN_WITH_PIN,
  FUNCTION_ASR_RECOGNIZE,
} from '@/lib/appwrite/constants';
```

### 4.1 `set-pin` — set a 4-digit PIN on the profile

Requires an active session.

```ts
import type { SetPinRequest, SetPinResponse } from '@/lib/appwrite/types';

const body: SetPinRequest = { pin: '1234' };
const execution = await functions.createExecution(
  FUNCTION_SET_PIN,
  JSON.stringify(body),
  false,                        // async = false (wait for result)
  '/',
  ExecutionMethod.POST,
);
const result: SetPinResponse = JSON.parse(execution.responseBody);
// result.ok === true on success
```

**Validation:** the Function rejects any PIN that is not exactly 4 digits.
**Security:** only the bcrypt hash is stored in `profiles.pin_hash` — the plain
PIN is never written to the database.

### 4.2 `login-with-pin` — PIN login without a fresh OTP

Call this **without** an active session (e.g. on a fresh device or after logout).
After receiving the response, exchange the secret for a real session.

```ts
import type { LoginWithPinRequest, LoginWithPinResponse } from '@/lib/appwrite/types';

const body: LoginWithPinRequest = { phone: '+91XXXXXXXXXX', pin: '1234' };
const execution = await functions.createExecution(
  FUNCTION_LOGIN_WITH_PIN,
  JSON.stringify(body),
  false,
  '/',
  ExecutionMethod.POST,
);
const { userId, secret }: LoginWithPinResponse = JSON.parse(execution.responseBody);

// Exchange the custom token for a real session
await account.createSession(userId, secret);
```

**Rate limiting:** 5 attempts per phone number per 15 minutes. HTTP 429 on breach.
**No phone enumeration:** wrong phone and wrong PIN return the identical error
`{ error: 'Invalid phone or PIN', code: 'AUTH_FAILED' }`.

### 4.3 `asr-recognize` — voice answer check

Requires an active session. Pass `x-consent: true` in the execution headers to
store the audio clip in the `recordings` bucket (consent-gated).

```ts
import type { AsrRecognizeRequest, AsrRecognizeResponse } from '@/lib/appwrite/types';

const body: AsrRecognizeRequest = {
  audioBase64: base64String,
  mimeType:    'audio/webm',
  expected:    ['batakh', 'बतख'],   // closed vocabulary
  exerciseId:  'level-1_sl0_ex1',
};

const execution = await functions.createExecution(
  FUNCTION_ASR_RECOGNIZE,
  JSON.stringify(body),
  false,
  '/',
  ExecutionMethod.POST,
  { 'x-consent': String(consentGranted) },  // 'true' | 'false'
);
const result: AsrRecognizeResponse = JSON.parse(execution.responseBody);
// result.matched — use as the success condition
// result.confidence — 0–1; biased lenient for children
// result.transcript — raw transcript for display/debugging
```

**Matching strategy (child-lenient):**
1. Normalize both sides (lowercase, strip diacritics, collapse spaces)
2. Exact match → confidence 1.0
3. Substring containment (child says "yeh ek batakh hai" → match "batakh") → conf 0.85
4. Fuzzy edit distance ≤ 2 → conf 0.75 (dist 1) / 0.55 (dist 2)

**Provider:** Sarvam AI Hindi ASR. Key lives in the Function's `SARVAM_API_KEY`
env var — never in the client bundle. Falls back to mock mode if key is absent
(returns `__MOCK_TRANSCRIPT__`, useful for local testing without an API key).

**Error shape on failure:** `{ error: string, code: string }` — provider keys are
never exposed in error messages.

---

## 5. Storage — assets and narration audio

### 5.1 Bucket overview

| Bucket | Access | Contents |
|---|---|---|
| `images` | Public (`Role.any()`) | Object illustrations, backgrounds, character art (SVG/WebP/AVIF) |
| `animations` | Public | Lottie JSON animations |
| `audio` | Public | Pre-generated narration clips (named by `audioName`) |
| `recordings` | Private (per-user permissions) | Consented child audio — never public |

### 5.2 Resolving file URLs

For audio clips and images referenced by `audioName` or `image` id in the content JSON:

```ts
import { storage } from '@/lib/appwrite/client';
import { BUCKET_AUDIO, BUCKET_IMAGES, BUCKET_ANIMATIONS } from '@/lib/appwrite/constants';

// Get a direct URL to a file (use for audio, Lottie, full-res images)
const url = storage.getFileView(BUCKET_AUDIO, audioName);
// Example: audioName = 'obj_batakh' → serves obj_batakh.opus from the audio bucket

// Get a resized, format-converted URL for low-bandwidth images
const previewUrl = storage.getFilePreview(
  BUCKET_IMAGES,
  imageId,
  400,            // width (px) — keeps aspect ratio
  undefined,      // height (optional)
  undefined,      // gravity
  75,             // quality (0–100)
  undefined,      // border
  undefined,      // borderColor
  undefined,      // borderRadius
  undefined,      // opacity
  undefined,      // rotation
  undefined,      // background
  'webp',         // output format — modern, compact
);
```

### 5.3 File naming convention

| Content | Bucket | File ID |
|---|---|---|
| Narration audio | `audio` | `audioName` from the narration manifest (e.g. `obj_batakh`, `sound_ba`) |
| Voice variants | `audio` | Suffixed `__tina` / `__toto` (e.g. `prompt_yeh_kya_hai__tina`) |
| Object illustrations | `images` | `obj_<name>.svg` or `obj_<name>.webp` |
| Backgrounds / scenes | `images` | Descriptive id (e.g. `bg_jungle_grey`, `scene_intro_01`) |
| Lottie animations | `animations` | `anim_<name>.json` (e.g. `anim_tina_idle`, `anim_firefly_burst`) |
| Forest layers | `images` | `forest_base.*`, `forest_layer_color.*`, … `forest_layer_birds_sky.*` |

### 5.4 Audio format

Narration clips are stored as **mono WAV or Opus/AAC** at ~22–44 kHz. The TTS
pipeline (`scripts/generate-audio.js`) uploads files named by `audioName`.
For lowest bandwidth, post-process with ffmpeg before uploading:
```bash
ffmpeg -i input.wav -c:a libopus -b:a 28k -ac 1 output.opus
```

### 5.5 Image transforms for low bandwidth

Appwrite's `getFilePreview` downscales images on-the-fly via the CDN — no
server code required. Use this for all background and character images:
- Object illustrations: request width 300–400px, `output=webp`
- Full-screen backgrounds: request width = device width (pass from CSS), `output=webp`, quality 70
- SVG files: serve via `getFileView` (already tiny and scales perfectly)

### 5.6 Service worker caching

The frontend service worker (Serwist) caches audio, image, and Lottie responses
from the Appwrite CDN under a **cache-first** strategy. After the first load,
the app plays narration and shows images without a network request.

---

## 5.7 Recording files and documents

Consent-gated recording files are stored in the `recordings` bucket with per-user
permissions. The `recordings` collection stores metadata. Neither is publicly readable.

---

## 6. Account deletion / data cleanup

When a user deletes their account, these resources must be cleaned up (no
automatic cascade in Appwrite — handle in a cleanup Function or via the
Appwrite console for the prototype):

1. Delete all documents in `progress` where `profile_id = userId`
2. Delete all documents in `recordings` where `profile_id = userId`
3. Delete all files in the `recordings` bucket belonging to the user
4. Delete the `profiles` document with id = `userId`
5. Delete the Appwrite account: `users.delete(userId)` (server SDK)

For the prototype this can be a manual admin action. A full implementation
wraps steps 1–5 in a `delete-account` Appwrite Function triggered by the user.

---

## 7. Rate limits

| Endpoint | Limit | Enforcement |
|---|---|---|
| `createPhoneToken` (OTP) | Appwrite built-in (configurable in console) | Appwrite |
| `login-with-pin` | 5 attempts per phone per 15 minutes | `login-with-pin` Function |

---

## 8. Backend ↔ frontend feature map

| Frontend need | Backend piece |
|---|---|
| Login (§7) phone+OTP, age, language | Appwrite Account phone OTP + `profiles` collection |
| Returning login without SMS | `login-with-pin` Function + persistent session |
| Resume at furthest point, any device | `progress` collection + per-doc permissions |
| Voice answering record → match | `asr-recognize` Function + closed-vocab match |
| Narration playback by `audioName` | TTS pipeline output in `audio` bucket |
| Offline/low-bandwidth media caching | Appwrite Storage + image transforms; frontend SW |
| Content JSON (Level 1) | Bundled in app — backend intentionally does NOT serve it |

---

## 9. Function environment variables

Set these in the Appwrite console (Functions → select function → Settings → Variables).
**Never** store values in source files, `.env` files committed to git, or Docker images.

### Deployed Functions

| Variable | Required by | Purpose |
|---|---|---|
| `APPWRITE_API_KEY` | `set-pin`, `login-with-pin`, `asr-recognize` | Server SDK — write to DB, mint custom tokens |
| `SARVAM_API_KEY` | `asr-recognize` | Sarvam AI ASR (Hindi speech recognition). If absent, the function runs in mock mode (returns `__MOCK_TRANSCRIPT__`) |

### TTS pipeline (`scripts/generate-audio.js`) — local / CI only

Set in `.env.local` or as CI secrets:

| Variable | Purpose |
|---|---|
| `APPWRITE_FUNCTION_API_ENDPOINT` | Appwrite endpoint (same as `NEXT_PUBLIC_APPWRITE_ENDPOINT`) |
| `APPWRITE_PROJECT_ID` | Appwrite project ID |
| `APPWRITE_API_KEY` | Server SDK key for uploading to the `audio` bucket |
| `SARVAM_API_KEY` | Sarvam AI TTS (primary) |
| `ELEVENLABS_API_KEY` | ElevenLabs TTS (fallback when `SARVAM_API_KEY` absent) |
| `ELEVENLABS_VOICE_TINA` | ElevenLabs voice ID for Tina (optional) |
| `ELEVENLABS_VOICE_TOTO` | ElevenLabs voice ID for Toto (optional) |
| `ELEVENLABS_VOICE_DEFAULT` | ElevenLabs voice ID for default voice (optional) |
