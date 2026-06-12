# Aksharvan Backend Build Status

> **Loop state file.** Claude Code updates this every iteration. The loop stops only when every epic is `DONE` and the Completion Oracle in `.claude/BACKEND-LOOP.md` §8 passes.

**Last updated:** 2026-06-12  
**Current epic:** COMPLETE  
**Iteration:** 8  
**Blockers:** none

---

## Epic tracker (B1–B8 from `02-BACKEND-PLAN.md` §10)

| Epic | Name | Status | Evidence (file/command output) |
|------|------|--------|--------------------------------|
| B1 | Appwrite project & schema | `DONE` | `appwrite.json` (valid JSON, all attrs match §4), `lib/appwrite/types.ts`, `lib/appwrite/constants.ts`, `.env.example`, `package.json`, `tsconfig.json`; `npm run typecheck` → clean exit 0 |
| B2 | Auth wiring (OTP + profiles convention) | `DONE` | `docs/BACKEND-INTEGRATION.md` §2 — OTP flow, MSG91 console steps, profiles create-on-signup, session persistence; aligns with `01-FRONTEND-PLAN.md` §7 |
| B3 | `set-pin` & `login-with-pin` Functions | `DONE` | `appwrite/functions/set-pin/src/main.js`, `appwrite/functions/login-with-pin/src/main.js`; `node --check` clean; bcrypt hash only stored; same AUTH_FAIL shape for wrong phone + wrong PIN; rate limit 5/15min; function entries in `appwrite.json`; §4.1/4.2 in BACKEND-INTEGRATION.md |
| B4 | Progress access (permissions + deterministic ids) | `DONE` | Schema already correct from B1: `documentSecurity:true`, `$permissions:[]`, `state size:65535`; `${userId}_${levelId}` + upsert pattern in BACKEND-INTEGRATION.md §3.2; `ProgressState` type aligned field-for-field; JSON.stringify/parse documented |
| B5 | `asr-recognize` Function | `DONE` | `appwrite/functions/asr-recognize/src/main.js` + `match.js` + `providers/sarvam.js`; `node --check` clean on all 4 files; `match.test.js`: 22/22 passed; shapes match §3 exactly; consent-gated recordings; mock mode when no SARVAM_API_KEY; §4.3 in BACKEND-INTEGRATION.md |
| B6 | TTS pipeline (`scripts/generate-audio.js`) | `DONE` | `scripts/generate-audio.js` + `lib/content/narration-manifest.json`; 72 entries (all §7 audioNames); pedagogy guard rejects "से" patterns; --dry-run and --force flags; Sarvam + ElevenLabs providers; re-runnable (skip existing); `node --check` + dry-run clean; `npm run generate-audio` in package.json |
| B7 | Storage & delivery config | `DONE` | Bucket permissions confirmed in `appwrite.json` (images/animations/audio: public; recordings: private+encrypted); BACKEND-INTEGRATION.md §5 added: getFileView, getFilePreview, naming convention, audio format, SW caching |
| B8 | Hardening, docs, integration contract | `DONE` | `README.md` backend section (setup, push, deploy, generate-audio); BACKEND-INTEGRATION.md §9 env vars table; account deletion §6; rate limits §7; feature map §8; typecheck clean; all node --check pass; 22/22 match tests |

Status values: `TODO` | `IN_PROGRESS` | `DONE` | `BLOCKED`

---

## Frontend contract alignment (must stay in sync with `01-FRONTEND-PLAN.md` §4)

| Contract item | Backend artifact | Aligned? |
|---------------|------------------|----------|
| Auth: `createPhoneToken` → `createSession` | Appwrite Account (console SMS provider) | yes |
| `set-pin` → `{ ok: true }` | `appwrite/functions/set-pin/src/main.js` | yes |
| `login-with-pin` → `{ userId, secret }` | `appwrite/functions/login-with-pin/src/main.js` | yes |
| `asr-recognize` → `{ matched, confidence, transcript }` | `appwrite/functions/asr-recognize/src/main.js` | yes |
| `profiles` collection + doc id = `$id` | `appwrite.json` — `profiles` collection, `documentSecurity: true`, attrs match §4 | yes |
| `progress` doc id = `${userId}_${levelId}` | `appwrite.json` + `docs/BACKEND-INTEGRATION.md §3.2` | yes |
| `state` stored as JSON string | schema (`state: string size 65535`) + `lib/appwrite/types.ts` `ProgressState` | yes |
| Storage buckets: images, animations, audio, recordings | `appwrite.json` — 4 buckets, public/private correctly set | yes |
| Narration by `audioName` | `lib/content/narration-manifest.json` + `scripts/generate-audio.js` + `audio` bucket | yes |

---

## Verification log (append each iteration)

```
=== Iteration 8 — B8: Hardening & docs (2026-06-12) ===

Files created/updated:
  README.md (backend setup section)
  docs/BACKEND-INTEGRATION.md §9 (Function env vars)
  docs/BACKEND-INTEGRATION.md §5.7 (recording files)
  package.json: "type": "module" added

=== FULL §8 COMPLETION ORACLE — ALL PASS ===

§8A File existence:
  ✓ appwrite.json
  ✓ appwrite/functions/set-pin/ (main.js + package.json)
  ✓ appwrite/functions/login-with-pin/ (main.js + package.json)
  ✓ appwrite/functions/asr-recognize/ (main + provider + matcher)
  ✓ scripts/generate-audio.js
  ✓ lib/appwrite/types.ts
  ✓ lib/appwrite/constants.ts
  ✓ lib/content/narration-manifest.json
  ✓ docs/BACKEND-INTEGRATION.md
  ✓ .env.example

§8B Schema contract:
  ✓ profiles: parent_phone, language, child_age, avatar_variant, pin_hash, created_at; documentSecurity:true; $permissions:[]
  ✓ progress: profile_id, level_id, state, updated_at; documentSecurity:true; $permissions:[]
  ✓ recordings: all 7 attrs; documentSecurity:true; $permissions:[]
  ✓ indexes: profile_id_idx and profile_level_idx on progress
  ✓ Buckets: images/animations/audio = public; recordings = private

§8C Function contracts:
  ✓ set-pin: { pin } → { ok: true }; 4-digit; bcrypt; x-appwrite-user-id required
  ✓ login-with-pin: { phone, pin } → { userId, secret }; rate limit 5/15min; AUTH_FAIL identical
  ✓ asr-recognize: { audioBase64, mimeType, expected, exerciseId } → { matched, confidence, transcript }

§8D Security:
  ✓ No API key literals in tracked source files
  ✓ pin_hash only — never plain pin stored
  ✓ recordings bucket: private ($permissions: [])

§8E Frontend complement:
  ✓ 24 contract coverage mentions in BACKEND-INTEGRATION.md
  ✓ feature map §8 maps all backend pieces to frontend needs

§8F Commands:
  ✓ npm run typecheck → tsc --noEmit → exit 0
  ✓ node --check set-pin/src/main.js: OK
  ✓ node --check login-with-pin/src/main.js: OK
  ✓ node --check asr-recognize/src/main.js: OK
  ✓ node --check asr-recognize/src/match.js: OK
  ✓ node --check asr-recognize/src/providers/sarvam.js: OK
  ✓ node --check scripts/generate-audio.js: OK
  ✓ node asr-recognize/src/match.test.js: 22 passed, 0 failed
  ✓ appwrite.json: valid JSON

=== COMPLETION ORACLE: ALL B1–B8 DONE ✓ ===

=== Iteration 7 — B7: Storage & delivery (2026-06-12) ===

Verification:
  ✓ images bucket: $permissions: ["read(\"any\")"], encryption: false
  ✓ animations bucket: $permissions: ["read(\"any\")"], encryption: false
  ✓ audio bucket: $permissions: ["read(\"any\")"], encryption: false
  ✓ recordings bucket: $permissions: [], encryption: true — private
  ✓ BACKEND-INTEGRATION.md §5: getFileView, getFilePreview, naming convention, audio format, SW caching

§8 Completion Oracle status after iteration 7:
  B1: DONE, B2: DONE, B3: DONE, B4: DONE, B5: DONE, B6: DONE, B7: DONE
  B8: TODO — loop continues (final epic)

=== Iteration 6 — B6: TTS pipeline (2026-06-12) ===

Files created:
  lib/content/narration-manifest.json (72 entries)
  scripts/generate-audio.js
  package.json: "type": "module" added

Verification:
  ✓ node --check scripts/generate-audio.js: syntax OK
  ✓ manifest valid JSON: 72 entries, no duplicates
  ✓ categories: cutscene, encouragement, nudge, object, prompt, restore, sound, teach, word
  ✓ dry-run: "72 entries, pedagogy rules pass"
  ✓ pedagogy guard: all teach/sound entries pass (no "से" patterns)
  ✓ all required audioNames from 03-CONTENT-PLAN.md §7 covered
  ✓ re-runnable: skips existing files unless --force
  ✓ npm run typecheck: exit 0

§8 Completion Oracle status after iteration 6:
  B1: DONE, B2: DONE, B3: DONE, B4: DONE, B5: DONE, B6: DONE
  B7–B8: TODO — loop continues

=== Iteration 5 — B5: asr-recognize Function (2026-06-12) ===

Files created:
  appwrite/functions/asr-recognize/package.json
  appwrite/functions/asr-recognize/src/main.js
  appwrite/functions/asr-recognize/src/match.js
  appwrite/functions/asr-recognize/src/match.test.js
  appwrite/functions/asr-recognize/src/providers/sarvam.js
  docs/BACKEND-INTEGRATION.md §4.3 populated

Verification:
  ✓ node --check main.js: OK
  ✓ node --check match.js: OK
  ✓ node --check providers/sarvam.js: OK
  ✓ node --check match.test.js: OK
  ✓ match.test.js: 22 passed, 0 failed
  ✓ Input: { audioBase64, mimeType, expected: string[], exerciseId }
  ✓ Output: { matched: boolean, confidence: number, transcript: string }
  ✓ recognize() abstraction in providers/sarvam.js (swappable)
  ✓ Matching: exact → substring → fuzzy (dist ≤ 2) — child-lenient
  ✓ Consent-gated: x-consent: true → writes to recordings bucket + collection
  ✓ Mock mode: no SARVAM_API_KEY → returns __MOCK_TRANSCRIPT__, conf 0
  ✓ Error shape: { error, code } — no provider key leakage
  ✓ npm run typecheck: exit 0

§8 Completion Oracle status after iteration 5:
  B1: DONE, B2: DONE, B3: DONE, B4: DONE, B5: DONE
  B6–B8: TODO — loop continues

=== Iteration 4 — B4: Progress access (2026-06-12) ===

Verification (all from existing artifacts — no new files needed):
  ✓ progress.documentSecurity: true
  ✓ progress.$permissions: [] (per-document only)
  ✓ state attr size: 65535 (large string for JSON)
  ✓ Indexes: profile_id_idx and profile_level_idx (composite)
  ✓ BACKEND-INTEGRATION.md §3.2 documents ${userId}_${levelId} upsert pattern
  ✓ ProgressState type: { sublevels: SublevelProgress[], restorationStage: number }
  ✓ SublevelProgress: { index, status: 'not_started'|'in_progress'|'completed', exercisesDone }
  ✓ JSON.stringify on write / JSON.parse on read documented at lines 189, 204, 211

§8 Completion Oracle status after iteration 4:
  B1: DONE, B2: DONE, B3: DONE, B4: DONE
  B5–B8: TODO — loop continues

=== Iteration 3 — B3: set-pin & login-with-pin (2026-06-12) ===

Files created:
  appwrite/functions/set-pin/src/main.js
  appwrite/functions/set-pin/package.json
  appwrite/functions/login-with-pin/src/main.js
  appwrite/functions/login-with-pin/package.json
  appwrite.json updated with 3 function entries (set-pin, login-with-pin, asr-recognize)
  docs/BACKEND-INTEGRATION.md §4.1 and §4.2 populated

Verification:
  ✓ node --check set-pin/src/main.js: syntax OK
  ✓ node --check login-with-pin/src/main.js: syntax OK
  ✓ set-pin: { pin } → { ok: true }; 4-digit validation; bcrypt hash; session check via x-appwrite-user-id
  ✓ login-with-pin: { phone, pin } → { userId, secret }; rate limit 5/15min; AUTH_FAIL identical for wrong phone & wrong PIN
  ✓ pin_hash only stored — plain PIN never written to DB
  ✓ users.createToken(userId) mints custom token
  ✓ appwrite.json functions: set-pin, login-with-pin, asr-recognize
  ✓ npm run typecheck: exit 0

§8 Completion Oracle status after iteration 3:
  B1: DONE, B2: DONE, B3: DONE
  B4–B8: TODO — loop continues

=== Iteration 2 — B2: Auth wiring (2026-06-12) ===

Files created:
  docs/BACKEND-INTEGRATION.md (§1 SDK setup, §2 auth, §3 database, §6 cleanup, §7 rate limits, §8 feature map)

Verification:
  ✓ docs/BACKEND-INTEGRATION.md exists
  ✓ createPhoneToken mentioned 3×, createSession 2× — flow documented
  ✓ MSG91 console steps documented (4 mentions) — no secrets in code
  ✓ profiles create-on-signup: doc id = account $id, per-user permissions shown
  ✓ account.get() session persistence documented
  ✓ pin_hash null on initial create
  ✓ "API key" appears only in console-setup prose — not code secrets
  ✓ Aligns with 01-FRONTEND-PLAN.md §7: avatar_variant mapping (4–5→0, 6–7→1, 8–10→2), doc id = account $id

§8 Completion Oracle status after iteration 2:
  B1: DONE, B2: DONE
  B3–B8: TODO — loop continues

=== Iteration 1 — B1: Appwrite project & schema (2026-06-12) ===

Files created:
  package.json
  tsconfig.json
  .env.example
  appwrite.json
  lib/appwrite/types.ts
  lib/appwrite/constants.ts

§8A File existence:
  ✓ appwrite.json
  ✓ lib/appwrite/types.ts
  ✓ lib/appwrite/constants.ts
  ✓ .env.example

§8B Schema contract:
  ✓ profiles attrs match (parent_phone, language, child_age, avatar_variant, pin_hash, created_at)
    documentSecurity: true
  ✓ progress attrs match (profile_id, level_id, state, updated_at)
    documentSecurity: true
  ✓ recordings attrs match (profile_id, exercise_id, audio_path, expected, transcript, matched, created_at)
    documentSecurity: true
  ✓ index on profile_id (progress collection)
  ✓ composite index includes level_id (profile_level_idx)
  Buckets: images (public), animations (public), audio (public), recordings (private / $permissions: [])

§8D Security:
  ✓ No secrets in tracked files (git grep clean)

§8F Typecheck:
  > npm run typecheck → tsc --noEmit → exit 0 (clean, no errors)

§8 Completion Oracle status after iteration 1:
  B1: DONE
  B2–B8: TODO — loop continues
```

---

## Escalation log

```
(none)
```
