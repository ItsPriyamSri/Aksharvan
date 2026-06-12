# Aksharvan — BACKEND PLAN (Prototype: Level 1)

> **Audience:** Claude Code. This is a build brief and the **counterpart to the frontend plan**. §3 (Shared API Contract) and §4 (Database) are the same contract written from the server side. **NOTE:** this plan now uses **Appwrite** (not Supabase). The frontend plan still references Supabase SDK calls in a few places — see §13 for the exact spots that must be swapped to the Appwrite equivalents below. The *data shapes* (profile fields, `progress.state` JSON, the `asr-recognize` request/response) are unchanged, so only the client plumbing differs, not the app logic.
> **Scope:** Just enough backend to support the Level 1 prototype: auth, profiles, cross-device progress, a secure ASR proxy, asset/audio hosting, and a build-time TTS pipeline. Keep it thin — most logic lives in the frontend.

---

## 1. What the backend is responsible for

1. **Auth** — phone + OTP signup/login, optional PIN for low-friction returning login, persistent sessions.
2. **Profiles** — store child age, language (hi), parent phone, avatar variant.
3. **Progress** — per-account, cross-device sync of level/sub-level state.
4. **ASR proxy** — receive the child's recorded answer, call the speech provider with the secret key (kept server-side), do closed-vocabulary matching against the expected answers, return a simple match result.
5. **Asset & audio hosting** — serve images, Lottie, and pre-generated narration clips over CDN.
6. **TTS pipeline (build-time)** — a script that turns the narration script list into compressed audio files. Not a runtime service.
7. **Privacy/security** — keep keys server-side, enforce document-level permissions, handle minors' data and consented audio responsibly.

What the backend does **not** do: it does not serve the learning content (the Level 1 content JSON is bundled in the frontend for offline/low-bandwidth) and it does **not** run TTS at runtime.

---

## 2. Stack

- **Appwrite** as the platform (use **Appwrite Cloud** for the prototype to avoid self-hosting devops; self-host later if needed):
  - **Databases** (collections + documents) for profiles, progress, recordings
  - **Authentication / Account** — phone (SMS) OTP built-in (requires an SMS provider configured in the console: Twilio, Vonage, Telesign, TextMagic, or **MSG91** — MSG91 is convenient for India)
  - **Storage** (buckets for assets, narration audio, and consented recordings) with file delivery + on-the-fly image previews/transforms
  - **Functions** (Node.js runtime) for custom logic: `set-pin`, `login-with-pin`, `asr-recognize`
- **SDKs:** `appwrite` (Web SDK, used by the frontend) and `node-appwrite` (server SDK, used inside Functions and the TTS upload script).
- **ASR provider:** **Sarvam AI** (India-tuned Hindi, primary). Pluggable — Google Speech-to-Text as a swappable alternative. Key stored as a **Function environment variable**.
- **TTS provider (build-time only):** **Sarvam AI** or **ElevenLabs multilingual** for generating Hindi narration clips. Key used by a local/CI script, never shipped.

Rationale: Appwrite gives auth + databases + storage + serverless Functions with minimal hand-written code, which suits a small team and a prototype, and accounts work across devices out of the box. The main conceptual differences from a SQL backend: data is **document-based** (collections/documents, not tables/rows), and row security is handled by **per-document permissions** rather than SQL RLS policies.

---

## 3. SHARED API CONTRACT (the frontend must match this)

The frontend uses the **Appwrite Web SDK** (`Client` configured with the Appwrite **endpoint** + **projectId**). Auth and data go through the SDK; custom logic goes through **Function executions**.

**Auth — Appwrite Account API (no custom endpoints needed):**
- Signup / first login (phone OTP):
  - `account.createPhoneToken(ID.unique(), phone)` → sends the SMS code; returns `{ userId, ... }`.
  - `account.createSession(userId, otpCode)` → verifies the code, creates a session. (For an existing user, pass that user's id to `createPhoneToken` instead of `ID.unique()`.)
- The SDK **persists and refreshes the session**, so returning users usually skip login entirely.
- Logout: `account.deleteSession('current')`.

**Functions (invoked via `functions.createExecution(functionId, body, ...)`; body is a JSON string). Authenticated executions run with the caller's session except `login-with-pin`, which is called without a session.**

| Function | Request body (JSON) | Success response (JSON) | Notes |
|---|---|---|---|
| `set-pin` | `{ pin: "1234" }` | `{ ok: true }` | Hash + store `pin_hash` on the caller's profile document. Validate 4 digits. |
| `login-with-pin` *(no session)* | `{ phone, pin }` | `{ userId, secret }` | Verify against `pin_hash`; mint a **custom token** server-side (`Users.createToken(userId)`); the client then calls `account.createSession(userId, secret)`. Rate-limit by phone. |
| `asr-recognize` | `{ audioBase64, mimeType, expected: string[], exerciseId }` | `{ matched: boolean, confidence: number, transcript: string }` | Calls the ASR provider, normalizes, matches against `expected`. |

**Databases accessed directly via the Web SDK (`databases.getDocument` / `createDocument` / `updateDocument`, protected by per-document permissions): collections `profiles`, `progress` (see §4).**

**Static files (Appwrite Storage):** images, Lottie JSON, narration audio — referenced by the frontend using the `audioName`/`image` ids from the content JSON, resolved to file-view URLs (`storage.getFileView(bucketId, fileId)`). No Function call; just URLs. TTS is **never** called at runtime — clips are pre-generated (§7).

---

## 4. Database (Appwrite Databases — document model)

Create one Database (e.g. `aksharvan`) with these collections. Appwrite has no native JSON column type, so `state` is a **String attribute holding JSON** (parsed by the frontend).

**Collection `profiles`** — one document per child account; **use the Appwrite account `$id` as the document id** (1:1 with the auth user).

| Attribute | Type | Notes |
|---|---|---|
| `parent_phone` | string | required |
| `language` | string | default `"hi"` |
| `child_age` | integer | 4–10 |
| `avatar_variant` | integer | 0 / 1 / 2 |
| `pin_hash` | string | nullable |
| `created_at` | datetime | set on create |

**Collection `progress`** — one document per profile per level. **Use a deterministic document id `${userId}_${levelId}`** so writes are natural upserts and uniqueness is guaranteed without a composite constraint.

| Attribute | Type | Notes |
|---|---|---|
| `profile_id` | string | the account `$id` |
| `level_id` | string | e.g. `"level-1"` |
| `state` | string (large, JSON) | frontend-owned shape below |
| `updated_at` | datetime | |

`state` JSON shape (owned by the frontend, mirrored here):
```json
{ "sublevels": [ { "index": 0, "status": "completed", "exercisesDone": 7 } ], "restorationStage": 1 }
```

**Collection `recordings`** (optional, consent-gated; for future ASR fine-tuning).

| Attribute | Type |
|---|---|
| `profile_id` | string |
| `exercise_id` | string |
| `audio_path` | string (storage file id) |
| `expected` | string |
| `transcript` | string |
| `matched` | boolean |
| `created_at` | datetime |

**Permissions (Appwrite's replacement for SQL row-level security):**
Set **per-document permissions** at create time so each user can only touch their own data:
```js
[
  Permission.read(Role.user(userId)),
  Permission.update(Role.user(userId)),
  Permission.delete(Role.user(userId)),
]
```
Configure the collections to **require document-level permissions** (do not grant collection-wide read to `Role.any()`/`Role.users()`). This is what makes per-account, cross-device progress safe: any device logged into the same account sees the same documents, and no one can read another child's data. Add an index on `progress.profile_id` (and `level_id`) for queries.

---

## 5. Auth flows

**Signup (first time):**
1. Frontend: `account.createPhoneToken(ID.unique(), phone)` → SMS code; capture the returned `userId`.
2. `account.createSession(userId, otpCode)` → session created; the Appwrite account exists.
3. Frontend creates the `profiles` document with id = `userId` (age, language=`hi`, avatar_variant) and the per-user permissions in §4.
4. Optionally call `set-pin` so the parent can set a 4-digit PIN for quick future logins.

**Returning user:** the persisted session usually drops them straight into the app. If the session is gone (logged out / new device):
- **Default:** phone OTP again (`createPhoneToken` → `createSession`), most secure; **or**
- **Low-friction option (the "something else"):** `login-with-pin` with phone + the PIN set at signup. The Function verifies the PIN, mints a **custom token** (`node-appwrite` `Users.createToken(userId)`), and returns `{ userId, secret }`; the client exchanges it via `account.createSession(userId, secret)`. Avoids SMS cost on every login. Rate-limit and lock after several failures.

**Secrets:** the Appwrite **API key** (server SDK, used by Functions to mint tokens / write privileged data) and the ASR provider key live in **Function environment variables**, never in the client bundle.

---

## 6. ASR proxy — `asr-recognize` Function (the key complement to the frontend's voice feature)

Why server-side: keeps the provider key secret, lets you swap providers without touching the app, and centralizes the matching logic.

**Logic:**
1. Receive `{ audioBase64, mimeType, expected: string[], exerciseId }` from an authenticated execution.
2. Decode audio; send to **Sarvam AI** ASR (Hindi). Get a transcript + provider confidence.
3. **Closed-vocabulary match** (do NOT trust open transcription): normalize the transcript and each `expected` string (trim, lowercase romanization / strip diacritics + whitespace, collapse common variants), then check for a match — exact, fuzzy within a small edit distance, or substring containment (kids add filler like "yeh ek batakh hai" when the expected is "batakh"). Combine provider confidence with match strength into a single `confidence` 0–1.
4. Return `{ matched, confidence, transcript }`. The frontend treats `matched` as success and otherwise nudges toward retry/tap.
5. If consent is on, store the clip in the `recordings` bucket + a `recordings` document.

**Robustness notes for the kid + low-bandwidth context:** expect short single-word answers, background noise, cheap mics. Keep the request small (a 2–4s mono clip). Bias toward accepting close matches — for this age, a false "wrong" is worse than a lenient "right." The tap fallback (frontend) covers the rest.

Provider abstraction: wrap the call in a `recognize(audio, lang)` interface so Google STT or Whisper can be dropped in.

---

## 7. TTS pipeline (build-time script, not a runtime endpoint)

All narration is fixed, so generate it once:
- Input: the **narration script list** from the content plan (every spoken line with a stable `audioName`, e.g. `prompt_yeh_kya_hai`, `obj_batakh`, `sound_ba`, `encourage_shabash`, `cutscene_intro_01`, …).
- Process: a Node script iterates the list, calls **Sarvam AI** / **ElevenLabs** with the appropriate **Tina voice** or **Toto voice**, and writes compressed **mono Opus/AAC (~24–32 kbps)** files named by `audioName`.
- Output: upload to the Appwrite Storage `audio` bucket via `node-appwrite` `Storage.createFile`. The frontend resolves them by `audioName` → file-view URL.
- Re-runnable: changing a line regenerates just that clip. **Pedagogy guardrail in the script copy:** sound prompts must read "बतख — ब" (object then sound), never "ब से बतख" / "बतख से ब" (the book marks those wrong).

---

## 8. Storage buckets

- `images` — backgrounds, map, object illustrations, character art (public read: `Role.any()`).
- `animations` — Lottie JSON (public read).
- `audio` — pre-generated narration clips (public read).
- `recordings` — consented child audio (private: per-user permissions / no public read).

Use Appwrite's **image preview/transform** (`getFilePreview` with width/quality/`output=webp`) to downscale images on the fly for low-bandwidth devices. Files are served over Appwrite's CDN; rely on the frontend service worker for repeat-visit caching (assets are versioned/immutable).

---

## 9. Privacy & security (this product serves minors)

- **Keys stay server-side** (ASR/TTS provider keys, Appwrite API key) — only in Function environment variables / CI, never in the client bundle.
- **Per-document permissions on every collection**; no public read of `profiles`/`progress`/`recordings`.
- **Minors' data:** collect the minimum (age, parent phone, language). Treat under India's **DPDP Act** principles — parental consent at signup, clear purpose, a deletion path (deleting the `profiles` document should cascade: also delete the user's `progress`/`recordings` documents and recording files — Appwrite has no automatic cascade, so handle it in a Function or a documented cleanup routine).
- **Audio recordings** are stored only with explicit consent, in the private `recordings` bucket, with a retention policy; default to NOT storing if consent is absent (ASR still works, you just skip the `recordings` write).
- Rate-limit `login-with-pin` and OTP requests to prevent abuse.

---

## 10. Build order (epics → stories; hours rough)

**B1 — Appwrite project & schema** · *~6h* — create project (Appwrite Cloud); Database + `profiles`/`progress`/`recordings` collections with attributes & indexes; set collections to require document-level permissions; create storage buckets with the right read rules; wire endpoint + projectId env for the frontend.

**B2 — Auth wiring** · *~6h* — configure an SMS provider for phone OTP; verify signup/login (`createPhoneToken` → `createSession`) from a test client; the `profiles` create-on-signup convention with per-user permissions; document session persistence.

**B3 — `set-pin` & `login-with-pin` Functions** · *~7h* — Node Functions; hash/verify PIN on the profile doc; mint a session via custom token (`Users.createToken`); rate limiting.

**B4 — Progress access** · *~3h* — verify client create/update/read of `progress` documents (deterministic id `${userId}_${levelId}`) under per-doc permissions; confirm a second device on the same account reads the same `state` (the per-account requirement).

**B5 — `asr-recognize` Function** · *~12h* — Node Function; Sarvam integration behind a `recognize()` interface; normalization + closed-vocab matching; confidence scoring; consent-gated `recordings` write (bucket file + document).

**B6 — TTS pipeline** · *~8h* — Node script reading the narration script list; Tina/Toto voices; compress + name by `audioName`; upload to the `audio` bucket via `node-appwrite`; re-run on change.

**B7 — Storage & delivery config** · *~3h* — buckets, public/private permissions, image preview/transform settings, file-view URL conventions.

**B8 — Hardening & docs** · *~6h* — rate limits, error shapes matching §3, secrets management, a short README mapping each Function/collection to the frontend feature it serves, and the deletion/cleanup routine.

---

## 11. How each backend piece complements the frontend

| Frontend need (frontend plan) | Backend piece (this plan) |
|---|---|
| Login (§7) phone+OTP, age, language | Appwrite Account phone OTP + `profiles` collection (§5) |
| Returning login without SMS each time | `login-with-pin` Function + persistent session (§5) |
| Resume at furthest point, any device (§6,§10) | `progress` collection + per-doc permissions, per-account (§4) |
| Voice answering record→match (§9) | `asr-recognize` Function + closed-vocab match (§6) |
| Narration playback by `audioName` (§9) | TTS pipeline output in `audio` bucket (§7,§8) |
| Offline/low-bandwidth caching of media (§10) | Appwrite Storage + image transforms; frontend SW caching (§8) |
| Content JSON bundled in app (§5) | Backend intentionally does NOT serve content |

---

## 12. Acceptance criteria

- Signup by phone+OTP (`createPhoneToken` → `createSession`) creates an Appwrite account + `profiles` document; age/language stored.
- A PIN can be set and used to log in without a fresh OTP (custom-token flow).
- `progress` documents create/update under per-doc permissions; logging into the same account on a second device returns the same `state`.
- `asr-recognize` returns `{matched,confidence,transcript}` for a Hindi audio clip and correctly accepts close/lenient matches against `expected`.
- All narration clips exist in the `audio` bucket, named by `audioName`, compressed, with the ALfA-correct "object — sound" phrasing.
- Provider keys + Appwrite API key are absent from the client bundle; per-document permissions block cross-account reads; recordings are private and consent-gated.

---

## 13. Impact on the other plans (what this Appwrite switch changes)

**Frontend plan — the *data shapes* are unchanged, but the *SDK plumbing* must be swapped from Supabase to Appwrite in these spots:**

- **§2 Stack:** replace `@supabase/supabase-js` with **`appwrite`** (Web SDK).
- **§4 Shared API Contract:** replace the whole Supabase block with the §3 Appwrite contract above —
  - "Supabase project URL + anon key" → **Appwrite endpoint + projectId**.
  - `supabase.auth.signInWithOtp` / `verifyOtp` → `account.createPhoneToken(...)` then `account.createSession(userId, otpCode)`.
  - "Tables via the Supabase client" → **`databases.getDocument/createDocument/updateDocument`** on the `profiles`/`progress` collections (doc id = account `$id` for profiles, `${userId}_${levelId}` for progress).
  - Edge-Function POSTs (`set-pin`, `login-with-pin`, `asr-recognize`) → **`functions.createExecution(functionId, jsonBody)`**; `login-with-pin` now returns `{ userId, secret }` and the client follows with `account.createSession(userId, secret)`.
  - "Supabase Storage / CDN" → **Appwrite Storage** file-view URLs (`storage.getFileView`), with `getFilePreview` for low-bandwidth image downscaling.
- **§11 Build order:** rename "Supabase client + env" (E1) → "Appwrite client (endpoint + projectId) + env"; "phone+OTP via Supabase" (E2) → "phone+OTP via Appwrite Account".

Because the request/response **shapes** (`asr-recognize`, profile fields, `progress.state`) are identical, the frontend's components and exercise logic don't change — only the auth/data/storage calls and the dependency.

**Content plan — unaffected.** It refers to "the backend TTS pipeline" and a "Storage `audio` bucket" generically; Appwrite has buckets too, so the audio manifest, scripts, asset specs, and naming conventions all stand as written.