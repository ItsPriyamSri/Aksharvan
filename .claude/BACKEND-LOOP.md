# Aksharvan Backend Build Loop

> **Purpose:** Autonomous, self-terminating loop for Claude Code to implement the **entire Level 1 backend** end-to-end. Stops only when the Completion Oracle (§8) passes.
>
> **Scope:** Backend only — Appwrite schema, Functions, TTS script, integration types/docs. Do **not** build Next.js pages, UI components, or exercise engine. Do create the **integration contract** the frontend team needs.
>
> **Authority:** `02-BACKEND-PLAN.md` (build spec) · `01-FRONTEND-PLAN.md` §4 (shared API contract) · `03-CONTENT-PLAN.md` §7 (narration manifest) · `CLAUDE.md` · `.claude/rules/backend.md`

---

## How to start (Claude Code)

### Recommended: `/goal` (runs until verifiably done)

```text
/goal Read .claude/BACKEND-LOOP.md and execute exactly ONE iteration (§4). After each turn, re-read .claude/BACKEND-STATUS.md and run the Completion Oracle (§8). Stop only when every epic B1–B8 is DONE and §8 passes with evidence logged in BACKEND-STATUS.md. If blocked after 3 attempts on the same blocker, log it in Escalation log and move to the next unblocked epic. Never declare done without §8 evidence.
```

### Alternative: `/loop` (dynamic self-paced)

```text
/loop Read .claude/BACKEND-LOOP.md — run one iteration (§4), update BACKEND-STATUS.md, run §8. If not complete, schedule the next iteration yourself.
```

### First-run bootstrap (repo is greenfield)

If `appwrite/` does not exist yet, iteration 1 is always **B1** — scaffold `appwrite.json`, directory layout, `.env.example`, and `lib/appwrite/types.ts` stubs before any Function code.

---

## §1 — Role & invariants

You are the **backend builder**, not the frontend builder. You are also the **integration architect** — the frontend team will wire to your contract without reading your implementation.

### Hard invariants (never violate)

1. **Appwrite only** — no Supabase, no custom Node server, no Next.js API routes.
2. **Secrets server-side only** — Appwrite API key, Sarvam/ElevenLabs keys live in Function env vars or CI secrets. Never in source, never in client bundle, never `process.env.KEY ?? "real_value"`.
3. **`appwrite.json` is schema source of truth** — every collection/bucket/index change goes there; push with `appwrite push`.
4. **Three Functions only** — `set-pin`, `login-with-pin`, `asr-recognize`. No extra Functions unless B8 docs justify one (e.g. account-deletion cleanup).
5. **TTS is build-time** — `scripts/generate-audio.js` uploads to Storage; no runtime TTS endpoint.
6. **Per-document permissions** on `profiles`, `progress`, `recordings`. Public read only on `images`, `animations`, `audio` buckets.
7. **Frontend contract is frozen** — request/response shapes in `02-BACKEND-PLAN.md` §3 and `01-FRONTEND-PLAN.md` §4 must match exactly. If you must change a shape, update **both** plan docs and `lib/appwrite/types.ts` in the same iteration and log it in BACKEND-STATUS.md.
8. **Do not touch** `app/`, `components/`, `next.config.ts`, PWA config, or frontend styling — except `lib/appwrite/` (types + thin SDK wrappers for the frontend team) and `.env.example`.

### What "done" means

All acceptance criteria in `02-BACKEND-PLAN.md` §12 are satisfied **and** the frontend can integrate using only:
- `NEXT_PUBLIC_APPWRITE_ENDPOINT`
- `NEXT_PUBLIC_APPWRITE_PROJECT_ID`
- Function IDs (documented)
- `lib/appwrite/types.ts`
- `docs/BACKEND-INTEGRATION.md`

---

## §2 — Target repository layout (create as you go)

```
appwrite.json                          # schema source of truth
appwrite/functions/
  set-pin/
    src/main.js                        # or index.js per Appwrite template
    package.json
  login-with-pin/
    src/main.js
    package.json
  asr-recognize/
    src/main.js
    package.json
    src/providers/sarvam.js            # recognize() abstraction
    src/match.js                       # closed-vocab matching
scripts/
  generate-audio.js                    # TTS build-time pipeline
  lib/narration-manifest.json          # OR consume lib/content/narration-manifest.json
lib/
  appwrite/
    types.ts                           # shared types — frontend imports these
    constants.ts                       # collection ids, bucket ids (public, safe)
lib/content/
  narration-manifest.json              # seed from 03-CONTENT-PLAN.md §7 if missing
docs/
  BACKEND-INTEGRATION.md               # frontend team's wiring guide
.env.example                           # NEXT_PUBLIC_* + script-only vars (no secrets)
```

---

## §3 — Epic definitions (work queue)

Work **in order**. Do not start B(n+1) until B(n) is `DONE` unless explicitly unblocked in BACKEND-STATUS.md.

### B1 — Appwrite project & schema (~6h)

**Deliverables:**
- `appwrite.json` with database `aksharvan`, collections `profiles`, `progress`, `recordings`
- Attributes per `02-BACKEND-PLAN.md` §4
- Indexes on `progress.profile_id`, `progress.level_id`
- Collections require document-level permissions (no collection-wide user read)
- Storage buckets: `images`, `animations`, `audio` (public read), `recordings` (private)
- `lib/appwrite/types.ts` — TypeScript interfaces for Profile, Progress, ProgressState, Recording, Function payloads/responses
- `lib/appwrite/constants.ts` — `DATABASE_ID`, `COLLECTION_*`, `BUCKET_*`
- `.env.example` with `NEXT_PUBLIC_APPWRITE_ENDPOINT`, `NEXT_PUBLIC_APPWRITE_PROJECT_ID`, and commented script vars

**Verify:** `appwrite.json` validates; types match §4 field-for-field.

---

### B2 — Auth wiring (~6h)

**Deliverables:**
- `docs/BACKEND-INTEGRATION.md` section: Phone OTP flow (`createPhoneToken` → `createSession`)
- Document SMS provider setup (MSG91 recommended for India) — console steps, not secrets
- Document profiles create-on-signup: doc id = account `$id`, permissions from §4
- Document session persistence behaviour for returning users

**Verify:** Flow documented; no code secrets; aligns with `01-FRONTEND-PLAN.md` §7 login spec.

---

### B3 — `set-pin` & `login-with-pin` (~7h)

**Deliverables:**
- `appwrite/functions/set-pin/` — 4-digit validation, bcrypt hash, store on profile, `{ ok: true }`, session required via `x-appwrite-user-id`
- `appwrite/functions/login-with-pin/` — no session; `{ phone, pin }` → `{ userId, secret }`; bcrypt verify; `users.createToken`; rate limit 5/15min per phone; no phone enumeration
- Unit-testable helpers where possible (hash verify, rate limit)
- Function entries in `appwrite.json`

**Verify:** Request/response match §3 table exactly. Plain PIN never stored. Wrong phone and wrong PIN return same error shape.

---

### B4 — Progress access (~3h)

**Deliverables:**
- Schema permissions confirmed for `progress` collection
- Document deterministic doc id `${userId}_${levelId}` and upsert pattern in `docs/BACKEND-INTEGRATION.md`
- `ProgressState` type in `types.ts` matches frontend shape:
  ```json
  { "sublevels": [{ "index": 0, "status": "completed", "exercisesDone": 7 }], "restorationStage": 1 }
  ```
- Document `JSON.stringify` on write / `JSON.parse` on read

**Verify:** Types + docs allow frontend `databases.createDocument` / `updateDocument` without backend changes.

---

### B5 — `asr-recognize` (~12h)

**Deliverables:**
- `appwrite/functions/asr-recognize/` — authenticated execution
- Input: `{ audioBase64, mimeType, expected: string[], exerciseId }`
- Output: `{ matched: boolean, confidence: number, transcript: string }`
- `recognize(audio, lang)` provider interface; Sarvam implementation
- Closed-vocab match: normalize, exact, fuzzy (edit distance ≤ 2), substring containment
- Bias lenient for child learners
- Consent-gated storage: if `x-consent: true`, write to `recordings` bucket + document; else skip
- Error responses: typed JSON `{ error: string, code: string }` — never leak provider keys

**Verify:** Matching logic has tests (at minimum `match.test.js` or inline test script). Shapes frozen per §3.

---

### B6 — TTS pipeline (~8h)

**Deliverables:**
- `lib/content/narration-manifest.json` seeded from `03-CONTENT-PLAN.md` §7 (all `audioName` entries)
- `scripts/generate-audio.js` — reads manifest, calls Sarvam or ElevenLabs, outputs mono Opus/AAC ~24–32 kbps, uploads via `node-appwrite` to `audio` bucket
- Pedagogy guard: reject lines matching bad patterns ("ब से", "से ब", etc.); enforce "object — sound" order
- Re-runnable: skip existing files unless `--force` flag
- `npm run generate-audio` script in `package.json`

**Verify:** Script runs in dry-run or mock mode without API key; validates manifest; documents required env vars in `.env.example`.

---

### B7 — Storage & delivery (~3h)

**Deliverables:**
- Bucket permissions finalised in `appwrite.json`
- `docs/BACKEND-INTEGRATION.md` sections:
  - `storage.getFileView(bucketId, fileId)` for audio/images/Lottie
  - `storage.getFilePreview` for low-bandwidth images (width, quality, `output=webp`)
  - URL conventions: files named by `audioName` / content JSON `image` ids

**Verify:** Public buckets readable by `Role.any()`; `recordings` not public.

---

### B8 — Hardening & docs (~6h)

**Deliverables:**
- `docs/BACKEND-INTEGRATION.md` complete — maps every backend piece to frontend feature (table from §11 of backend plan)
- Account deletion / cleanup routine documented (delete profile → progress → recordings docs + files)
- Rate limits documented for OTP and PIN
- `README.md` backend section: setup, `appwrite push`, `appwrite deploy function`, `npm run generate-audio`
- All Function env vars documented (names only, not values)
- Run lint/typecheck on any TS in `lib/appwrite/`

**Verify:** A frontend developer can integrate without asking you questions.

---

## §4 — Single-iteration protocol (execute every loop tick)

Each iteration is **one focused slice of work** — typically one epic or one story within the current epic. Never attempt all epics in one turn.

### Step 0 — Orient (read-only)

1. Read `.claude/BACKEND-STATUS.md`
2. Read `02-BACKEND-PLAN.md` § relevant to current epic
3. Cross-check `01-FRONTEND-PLAN.md` §4 for the same epic's contract
4. Read `CLAUDE.md` and `.claude/rules/backend.md`
5. Search `appwrite/`, `scripts/`, `lib/appwrite/` for existing code — extend, don't duplicate

### Step 1 — Plan (write 3–6 bullets in status file)

State exactly which files you will create/modify and what "done" means for this iteration.

### Step 2 — Implement

- Touch minimum files
- Match existing style once code exists
- No `console.log` left behind
- No secrets in code

### Step 3 — Verify (the builder runs these; do not skip)

Run applicable checks and capture output in BACKEND-STATUS.md Verification log:

```bash
# TypeScript (integration types)
npm run typecheck 2>&1 | tail -20

# Function syntax (per function)
node --check appwrite/functions/set-pin/src/main.js
node --check appwrite/functions/login-with-pin/src/main.js
node --check appwrite/functions/asr-recognize/src/main.js

# TTS script syntax
node --check scripts/generate-audio.js

# ASR matching unit tests (if present)
node appwrite/functions/asr-recognize/src/match.test.js

# Schema sanity
test -f appwrite.json && echo "appwrite.json exists"
```

If `npm run typecheck` fails because no `package.json` exists yet, scaffold minimal `package.json` + `tsconfig.json` as part of B1 — the frontend will need them anyway.

### Step 4 — Update state

1. Set epic status in BACKEND-STATUS.md
2. Fill Evidence column with file paths + command results
3. Update Frontend contract alignment table
4. Increment iteration counter
5. Set `Current epic` to next `TODO` epic

### Step 5 — Reflect (every 3 iterations)

Answer in Verification log:
- Am I on track or repeating failed approaches?
- Did I accidentally scope-creep into frontend?
- Is the API contract still aligned with `01-FRONTEND-PLAN.md` §4?

### Step 6 — Stop check

Run Completion Oracle (§8). If pass → stop loop. If fail → continue next iteration.

---

## §5 — Maker / checker separation

**You are the maker.** You do not get to declare the backend complete by assertion alone.

The **checker** is deterministic:
1. BACKEND-STATUS.md shows all B1–B8 as `DONE`
2. Completion Oracle (§8) commands all pass
3. Contract alignment table shows all `Aligned?` = `yes`
4. No open `BLOCKED` items without documented workaround

If you are both building and checking, you must still **paste command output** as evidence. "Looks good" is not evidence.

---

## §6 — Frontend integration contract (keep this stable)

The frontend team (`01-FRONTEND-PLAN.md`) will use:

| Frontend call | Your backend |
|---------------|--------------|
| `account.createPhoneToken` / `createSession` | Appwrite Account + SMS provider |
| `account.createSession(userId, secret)` after PIN | `login-with-pin` output |
| `functions.createExecution('set-pin', …)` | `set-pin` Function |
| `functions.createExecution('login-with-pin', …)` | `login-with-pin` Function (no session) |
| `functions.createExecution('asr-recognize', …)` | `asr-recognize` Function |
| `databases.*` on `profiles` | collection schema + permissions |
| `databases.*` on `progress` | deterministic id + JSON string `state` |
| `storage.getFileView` / `getFilePreview` | buckets + file naming |
| `import type { … } from '@/lib/appwrite/types'` | `lib/appwrite/types.ts` |

Export Function IDs and collection/bucket IDs from `lib/appwrite/constants.ts` so the frontend never hardcodes magic strings.

---

## §7 — Escalation & safety rails

| Condition | Action |
|-----------|--------|
| Same blocker 3 iterations | Log in Escalation log; document workaround; skip to next epic if independent |
| Missing Sarvam/ElevenLabs API key | Implement provider interface + mock; document env var; mark B5/B6 `DONE` with `MOCK_MODE` note |
| Missing Appwrite Cloud project | Complete all code + `appwrite.json`; document manual `appwrite push` steps; mark `BLOCKED: needs project` |
| 20 iterations without §8 pass | Stop; write summary of remaining work in BACKEND-STATUS.md |
| Tempted to edit `app/` or `components/` | Stop; log "scope violation avoided" |

**Never** run `appwrite push` or `appwrite deploy` against production without explicit user confirmation in chat. Preparing configs and documenting commands is fine.

---

## §8 — Completion Oracle (stop condition)

The loop **ends** only when ALL checks below pass. Paste results into BACKEND-STATUS.md.

### A. File existence

- [ ] `appwrite.json`
- [ ] `appwrite/functions/set-pin/` (entrypoint + package.json)
- [ ] `appwrite/functions/login-with-pin/`
- [ ] `appwrite/functions/asr-recognize/` (with `recognize()` abstraction + matcher)
- [ ] `scripts/generate-audio.js`
- [ ] `lib/appwrite/types.ts`
- [ ] `lib/appwrite/constants.ts`
- [ ] `lib/content/narration-manifest.json`
- [ ] `docs/BACKEND-INTEGRATION.md`
- [ ] `.env.example`

### B. Schema contract (grep/read — no guessing)

- [ ] `profiles` attributes: `parent_phone`, `language`, `child_age`, `avatar_variant`, `pin_hash`, `created_at`
- [ ] `progress` attributes: `profile_id`, `level_id`, `state`, `updated_at`
- [ ] `recordings` attributes per §4
- [ ] Progress doc id pattern documented as `${userId}_${levelId}`

### C. Function contract (read source — shapes must match §3)

- [ ] `set-pin`: `{ pin }` → `{ ok: true }`; 4-digit; bcrypt; session required
- [ ] `login-with-pin`: `{ phone, pin }` → `{ userId, secret }`; rate limited; no enumeration
- [ ] `asr-recognize`: `{ audioBase64, mimeType, expected, exerciseId }` → `{ matched, confidence, transcript }`

### D. Security

- [ ] No API keys in tracked files (`git grep -iE '(sarvam|sk-|api.key|secret.*=)' -- . ':!*.md'`)
- [ ] `pin_hash` only — never plain `pin` in database writes
- [ ] `recordings` bucket not publicly readable

### E. Frontend complement (read both plans)

- [ ] `01-FRONTEND-PLAN.md` §4 and `02-BACKEND-PLAN.md` §3 describe identical shapes
- [ ] `docs/BACKEND-INTEGRATION.md` maps to frontend features (backend plan §11 table)

### F. Commands

- [ ] `npm run typecheck` exits 0 (or N/A with documented reason — prefer fixing)
- [ ] All `node --check` on Functions and TTS script exit 0

---

## §9 — Iteration prompt (copy for manual re-run)

```text
You are building the Aksharvan backend. Read .claude/BACKEND-LOOP.md §4 and execute ONE iteration.

Rules: @CLAUDE.md @.claude/rules/backend.md @02-BACKEND-PLAN.md @01-FRONTEND-PLAN.md (§4 only for contract)

1. Read .claude/BACKEND-STATUS.md — work on Current epic only
2. Implement the smallest complete slice that moves the epic toward DONE
3. Run §4 Step 3 verification commands; paste output
4. Update .claude/BACKEND-STATUS.md (epic table, contract table, verification log)
5. Run §8 Completion Oracle — if all pass, respond "BACKEND COMPLETE" and stop; else continue

Do NOT build frontend pages. DO build lib/appwrite/types.ts and docs/BACKEND-INTEGRATION.md.
```

---

## §10 — Quick reference: acceptance criteria (from backend plan §12)

1. Phone+OTP signup creates account + profiles doc with age/language
2. PIN set + login without fresh OTP via custom token flow
3. Progress docs sync cross-device under per-doc permissions
4. `asr-recognize` leniently matches Hindi child speech against `expected[]`
5. Narration clips generatable by `audioName` with correct pedagogy phrasing
6. No secrets in client bundle; per-doc permissions; consent-gated recordings
