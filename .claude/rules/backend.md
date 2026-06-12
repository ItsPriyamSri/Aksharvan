---
paths:
  - "appwrite/functions/**/*"
  - "appwrite/**/*"
  - "scripts/**/*"
---

# Backend / Appwrite Rules (appwrite/, scripts/)

## Functions runtime

- Functions use the **Node.js runtime** (pin the version in `appwrite.json`).
- Use `node-appwrite` (server SDK) inside functions. Never use the web SDK here.
- The Appwrite API key and provider keys (Sarvam, ElevenLabs) live ONLY as
  Function environment variables configured in the Appwrite console / CI.
  They must never appear in source code, committed `.env` files, or Docker images.

## The three functions — what each one does and what it must not do

**`set-pin`** — Receives `{ pin }`, hashes it, stores `pin_hash` on the caller's
profile document. Validates 4-digit format. Returns `{ ok: true }`.
- Must not store the plain-text PIN anywhere.
- Must verify the caller has an active session (check `req.headers['x-appwrite-user-id']`).

**`login-with-pin`** — Receives `{ phone, pin }` with NO session.
- Looks up the profile by phone, verifies the bcrypt hash.
- Mints a custom token with `users.createToken(userId)`.
- Returns `{ userId, secret }`. The client calls `account.createSession(userId, secret)`.
- Must rate-limit: max 5 attempts per phone per 15 minutes. Lock on breach.
- Never return information about whether the phone exists (prevents enumeration).

**`asr-recognize`** — Receives `{ audioBase64, mimeType, expected: string[], exerciseId }`.
- Decodes audio, sends to Sarvam ASR (Hindi). Gets transcript + confidence.
- Runs closed-vocabulary matching against `expected[]`:
  normalize both sides (trim, lowercase, strip diacritics), check exact match,
  then fuzzy (edit distance ≤ 2), then substring containment.
  Kids say "yeh ek batakh hai" when the expected is "batakh" — substring handles this.
- Returns `{ matched: boolean, confidence: number, transcript: string }`.
- If `req.headers['x-consent'] === 'true'`, store the clip in the `recordings` bucket
  and insert a `recordings` document. Otherwise skip storage entirely.
- Bias toward accepting: for this age group, a false "wrong" is worse than a lenient "right."
- Wrap the Sarvam call in a `recognize(audio, lang)` interface so Google STT can be
  swapped in without changing the function logic.

## Schema changes

- `appwrite.json` is the single source of truth. Every schema change must be made
  there and pushed with `appwrite push` — never make manual changes in the console
  without reflecting them in `appwrite.json`.
- After a schema change, update `lib/appwrite/types.ts` in the same commit.

## TTS pipeline (scripts/generate-audio.js)

- This is a build-time script, not a deployed service. Run it when narration copy changes.
- It reads the narration manifest from `lib/content/narration-manifest.json`.
- Generates compressed mono Opus/AAC (~24–32 kbps) files named by `audioName`.
- Uploads to the Appwrite `audio` bucket via `node-appwrite` `storage.createFile`.
- Pedagogy rule enforced in the script: sound clips MUST say "बतख — ब" (object then
  sound), never "ब से बतख" or "बतख से ब". The script validates this pattern before
  uploading by checking the script copy against a known-bad-pattern list.
- Re-runnable: changing one line regenerates only that clip (check file existence first).

## Deployment

- Deploy functions with `appwrite deploy function --all`. Never manually upload.
- After any schema change: `appwrite push`. Document it in the PR.
- CI passes function env vars via Appwrite console secrets — never via `.env` in this repo.
